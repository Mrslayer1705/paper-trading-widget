/**
 * Market Data Service
 *
 * This service is responsible for:
 * 1. Fetching current market prices (LTP)
 * 2. Subscribing to market data feeds
 * 3. Providing real-time updates for paper order prices
 */

const PaperOrder = require('../models/PaperOrder');
const MarketDataProvider = require('./MarketDataProvider');

class MarketDataService {
  constructor(io) {
    this.io = io;
    this.marketDataProvider = new MarketDataProvider(io);
    this.activeSubscriptions = new Map(); // Map of token -> boolean

    // Initialize the market data provider
    this.marketDataProvider.initialize().catch(error => {
      console.error('Failed to initialize market data provider:', error);
    });
  }

  /**
   * Get current LTP for a token
   */
  async getCurrentLTP(token, initialPrice = null) {
    try {
      // Get LTP from market data provider
      return await this.marketDataProvider.getCurrentLTP(token, initialPrice);
    } catch (error) {
      console.error(`Error getting LTP for token ${token}:`, error);

      // Return initial price or generate a random price if not available
      return initialPrice || this.generateRandomPrice();
    }
  }

  /**
   * Subscribe to market data for a token
   */
  subscribe(token) {
    if (this.activeSubscriptions.has(token)) {
      return; // Already subscribed
    }

    // Subscribe to market data
    this.marketDataProvider.subscribe(token, (ltp) => {
      // Update orders when price changes
      this.updateOrderLTP(token, ltp);
    });

    this.activeSubscriptions.set(token, true);
  }

  /**
   * Generate a random price for testing
   */
  generateRandomPrice() {
    return parseFloat((Math.random() * 1000 + 100).toFixed(2));
  }

  /**
   * Update order LTP in database and calculate PnL
   */
  async updateOrderLTP(token, ltp) {
    try {
      // Find all open orders with this token
      const orders = await PaperOrder.find({
        tok: token,
        status: 'open'
      });

      // Update each order
      for (const order of orders) {
        // Determine if it's a buy or sell order
        const isBuy = order.flBuyQty > 0;

        // Calculate unrealized PnL
        let unrealizedPnL;
        if (isBuy) {
          // For Buy trades: (currentPrice - entryPrice) * quantity
          unrealizedPnL = (ltp - order.entryPrice) * order.flBuyQty;
        } else {
          // For Sell trades: (entryPrice - currentPrice) * quantity
          unrealizedPnL = (order.entryPrice - ltp) * order.flSellQty;
        }

        // Update order
        await PaperOrder.findByIdAndUpdate(
          order._id,
          {
            currentLTP: ltp,
            unrealizedPnL,
            lastUpdated: new Date()
          },
          { new: true }
        );

        // Emit PnL update
        this.io.emit(`pnl-update:${order._id}`, {
          orderId: order._id,
          currentLTP: ltp,
          unrealizedPnL
        });
      }
    } catch (error) {
      console.error('Error updating order LTP:', error);
    }
  }

  /**
   * Unsubscribe from market data updates
   */
  unsubscribe(token) {
    if (this.activeSubscriptions.has(token)) {
      // Unsubscribe from market data provider
      this.marketDataProvider.unsubscribe(token);
      this.activeSubscriptions.delete(token);
    }
  }
}

module.exports = MarketDataService;
