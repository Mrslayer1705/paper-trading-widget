/**
 * Market Data Provider Service
 * 
 * This service is responsible for:
 * 1. Connecting to Kotak/Dhan API for market data
 * 2. Subscribing to market data feeds
 * 3. Providing real-time updates for paper order prices
 */

const WebSocket = require('ws');
const axios = require('axios');
const PaperOrder = require('../models/PaperOrder');

class MarketDataProvider {
  constructor(io) {
    this.io = io;
    this.ws = null;
    this.isConnected = false;
    this.subscriptions = new Map(); // Map of token -> callback
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectInterval = 5000; // 5 seconds
    
    // Fallback to mock data if API is not available
    this.useMockData = process.env.USE_MOCK_DATA === 'true' || true;
    this.mockDataIntervals = new Map();
  }
  
  /**
   * Initialize the market data provider
   */
  async initialize() {
    if (this.useMockData) {
      console.log('Using mock market data provider');
      return;
    }
    
    try {
      await this.authenticate();
      await this.connectWebSocket();
    } catch (error) {
      console.error('Failed to initialize market data provider:', error);
      console.log('Falling back to mock data');
      this.useMockData = true;
    }
  }
  
  /**
   * Authenticate with the market data API
   */
  async authenticate() {
    try {
      // For Kotak API
      if (process.env.MARKET_DATA_PROVIDER === 'kotak') {
        const response = await axios.post(process.env.KOTAK_AUTH_URL, {
          userid: process.env.KOTAK_USER_ID,
          password: process.env.KOTAK_PASSWORD,
          app_id: process.env.KOTAK_APP_ID
        });
        
        this.authToken = response.data.token;
        console.log('Authenticated with Kotak API');
      } 
      // For Dhan API
      else if (process.env.MARKET_DATA_PROVIDER === 'dhan') {
        const response = await axios.post(process.env.DHAN_AUTH_URL, {
          client_id: process.env.DHAN_CLIENT_ID,
          client_secret: process.env.DHAN_CLIENT_SECRET
        });
        
        this.authToken = response.data.access_token;
        console.log('Authenticated with Dhan API');
      }
      else {
        throw new Error('Invalid market data provider');
      }
    } catch (error) {
      console.error('Authentication failed:', error);
      throw error;
    }
  }
  
  /**
   * Connect to the WebSocket for market data
   */
  async connectWebSocket() {
    try {
      // Determine WebSocket URL based on provider
      const wsUrl = process.env.MARKET_DATA_PROVIDER === 'kotak' 
        ? process.env.KOTAK_WS_URL 
        : process.env.DHAN_WS_URL;
      
      // Create WebSocket connection
      this.ws = new WebSocket(wsUrl, {
        headers: {
          Authorization: `Bearer ${this.authToken}`
        }
      });
      
      // Set up event handlers
      this.ws.on('open', this.handleOpen.bind(this));
      this.ws.on('message', this.handleMessage.bind(this));
      this.ws.on('error', this.handleError.bind(this));
      this.ws.on('close', this.handleClose.bind(this));
      
    } catch (error) {
      console.error('WebSocket connection failed:', error);
      throw error;
    }
  }
  
  /**
   * Handle WebSocket open event
   */
  handleOpen() {
    console.log('WebSocket connected');
    this.isConnected = true;
    this.reconnectAttempts = 0;
    
    // Resubscribe to all tokens
    for (const [token, callback] of this.subscriptions.entries()) {
      this.subscribeToMarketData(token);
    }
  }
  
  /**
   * Handle WebSocket message event
   */
  handleMessage(data) {
    try {
      const message = JSON.parse(data);
      
      // Process market data based on provider format
      if (process.env.MARKET_DATA_PROVIDER === 'kotak') {
        this.processKotakMarketData(message);
      } else {
        this.processDhanMarketData(message);
      }
    } catch (error) {
      console.error('Error processing WebSocket message:', error);
    }
  }
  
  /**
   * Process market data from Kotak API
   */
  processKotakMarketData(message) {
    if (message.type === 'tick' && message.data) {
      const { token, ltp } = message.data;
      
      if (token && ltp && this.subscriptions.has(token)) {
        const callback = this.subscriptions.get(token);
        callback(ltp);
        
        // Emit market update
        this.io.emit(`market-update:${token}`, {
          token,
          ltp
        });
      }
    }
  }
  
  /**
   * Process market data from Dhan API
   */
  processDhanMarketData(message) {
    if (message.type === 'quote' && message.data) {
      const { token, lastPrice } = message.data;
      
      if (token && lastPrice && this.subscriptions.has(token)) {
        const callback = this.subscriptions.get(token);
        callback(lastPrice);
        
        // Emit market update
        this.io.emit(`market-update:${token}`, {
          token,
          ltp: lastPrice
        });
      }
    }
  }
  
  /**
   * Handle WebSocket error event
   */
  handleError(error) {
    console.error('WebSocket error:', error);
  }
  
  /**
   * Handle WebSocket close event
   */
  handleClose() {
    console.log('WebSocket disconnected');
    this.isConnected = false;
    
    // Attempt to reconnect
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
      
      setTimeout(() => {
        this.connectWebSocket();
      }, this.reconnectInterval);
    } else {
      console.log('Max reconnect attempts reached. Falling back to mock data.');
      this.useMockData = true;
      
      // Restart all subscriptions with mock data
      for (const [token, callback] of this.subscriptions.entries()) {
        this.subscribeToMockData(token, callback);
      }
    }
  }
  
  /**
   * Subscribe to market data for a token
   */
  subscribe(token, callback) {
    this.subscriptions.set(token, callback);
    
    if (this.useMockData) {
      return this.subscribeToMockData(token, callback);
    } else if (this.isConnected) {
      return this.subscribeToMarketData(token);
    }
    
    // If not connected, the subscription will be processed when connection is established
    return null;
  }
  
  /**
   * Subscribe to market data via WebSocket
   */
  subscribeToMarketData(token) {
    if (!this.isConnected) return;
    
    const subscribeMessage = process.env.MARKET_DATA_PROVIDER === 'kotak'
      ? { type: 'subscribe', tokens: [token] }
      : { action: 'subscribe', tokens: [token] };
    
    this.ws.send(JSON.stringify(subscribeMessage));
    console.log(`Subscribed to market data for token: ${token}`);
  }
  
  /**
   * Subscribe to mock market data
   */
  subscribeToMockData(token, callback) {
    // Generate initial price
    const initialPrice = this.generateRandomPrice();
    
    // Call callback with initial price
    callback(initialPrice);
    
    // Emit initial market update
    this.io.emit(`market-update:${token}`, {
      token,
      ltp: initialPrice
    });
    
    // Set up interval for price updates
    const interval = setInterval(() => {
      // Get current price
      const currentPrice = this.mockDataIntervals.get(token).price;
      
      // Generate new price with small random change
      const priceChange = currentPrice * (Math.random() * 0.01 - 0.005);
      const newPrice = Math.max(0.05, currentPrice + priceChange);
      
      // Update stored price
      this.mockDataIntervals.get(token).price = newPrice;
      
      // Call callback with new price
      callback(newPrice);
      
      // Emit market update
      this.io.emit(`market-update:${token}`, {
        token,
        ltp: newPrice
      });
    }, 5000); // Update every 5 seconds
    
    // Store interval and initial price
    this.mockDataIntervals.set(token, {
      interval,
      price: initialPrice
    });
    
    return initialPrice;
  }
  
  /**
   * Unsubscribe from market data for a token
   */
  unsubscribe(token) {
    if (this.useMockData) {
      // Clear mock data interval
      if (this.mockDataIntervals.has(token)) {
        clearInterval(this.mockDataIntervals.get(token).interval);
        this.mockDataIntervals.delete(token);
      }
    } else if (this.isConnected) {
      // Unsubscribe via WebSocket
      const unsubscribeMessage = process.env.MARKET_DATA_PROVIDER === 'kotak'
        ? { type: 'unsubscribe', tokens: [token] }
        : { action: 'unsubscribe', tokens: [token] };
      
      this.ws.send(JSON.stringify(unsubscribeMessage));
    }
    
    // Remove from subscriptions
    this.subscriptions.delete(token);
    console.log(`Unsubscribed from market data for token: ${token}`);
  }
  
  /**
   * Generate a random price for mock data
   */
  generateRandomPrice() {
    return parseFloat((Math.random() * 1000 + 100).toFixed(2));
  }
  
  /**
   * Get current LTP for a token
   */
  async getCurrentLTP(token, initialPrice = null) {
    if (this.useMockData) {
      // If we already have mock data for this token, return it
      if (this.mockDataIntervals.has(token)) {
        return this.mockDataIntervals.get(token).price;
      }
      
      // Otherwise, create a new subscription with mock data
      return new Promise((resolve) => {
        const price = this.subscribeToMockData(token, (ltp) => {
          // This callback will be called with future updates
        });
        resolve(price);
      });
    } else {
      // Get real-time quote from API
      try {
        const quoteUrl = process.env.MARKET_DATA_PROVIDER === 'kotak'
          ? `${process.env.KOTAK_API_URL}/quote?token=${token}`
          : `${process.env.DHAN_API_URL}/quote?token=${token}`;
        
        const response = await axios.get(quoteUrl, {
          headers: {
            Authorization: `Bearer ${this.authToken}`
          }
        });
        
        const ltp = process.env.MARKET_DATA_PROVIDER === 'kotak'
          ? response.data.ltp
          : response.data.lastPrice;
        
        return ltp;
      } catch (error) {
        console.error('Error fetching quote:', error);
        
        // Fall back to mock data if API fails
        if (initialPrice) return initialPrice;
        return this.generateRandomPrice();
      }
    }
  }
}

module.exports = MarketDataProvider;
