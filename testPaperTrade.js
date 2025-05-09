/**
 * Test script for paper trading API
 *
 * This script demonstrates how to use the API to:
 * 1. Create a new paper trade
 * 2. Get trade details
 * 3. Square off the trade
 */

const axios = require('axios');
const moment = require('moment');

const API_URL = 'http://localhost:5000/api';

// Format expiry date for the next month
const nextMonth = moment().add(1, 'month');
const expiryDate = nextMonth.format('DD MMM, YYYY');

// Sample trade data
const tradeData = {
  symbol: 'NIFTY',
  strike: '24000',
  optionType: 'CE',
  action: 'BUY',
  lotSize: 75,
  contractToken: '43854',
  expiry: expiryDate
};

// Create a new paper trade
const createTrade = async () => {
  try {
    console.log('Creating new paper trade...');
    console.log('Request data:', JSON.stringify(tradeData, null, 2));
    
    const response = await axios.post(`${API_URL}/paper-trade/order`, tradeData);
    
    console.log('Paper trade created successfully:');
    console.log(JSON.stringify(response.data, null, 2));
    
    return response.data.orderId;
  } catch (error) {
    console.error('Error creating paper trade:', error.response?.data || error.message);
    throw error;
  }
};

// Get trade details
const getTrade = async (tradeId) => {
  try {
    console.log(`Getting trade details for ID: ${tradeId}...`);
    const response = await axios.get(`${API_URL}/trades/${tradeId}`);
    
    console.log('Trade details:');
    console.log(JSON.stringify(response.data, null, 2));
    
    return response.data.data;
  } catch (error) {
    console.error('Error getting trade:', error.response?.data || error.message);
    throw error;
  }
};

// Square off a trade
const squareOffTrade = async (orderId) => {
  try {
    console.log(`Squaring off trade with ID: ${orderId}...`);
    
    const squareOffData = {
      orderId
    };
    
    const response = await axios.post(`${API_URL}/paper-trade/square-off`, squareOffData);
    
    console.log('Trade squared off successfully:');
    console.log(JSON.stringify(response.data, null, 2));
    
    return response.data.data;
  } catch (error) {
    console.error('Error squaring off trade:', error.response?.data || error.message);
    throw error;
  }
};

// Run the test
const runTest = async () => {
  try {
    // Create a trade
    const orderId = await createTrade();
    
    // Wait for 10 seconds to allow some price updates
    console.log('Waiting for 10 seconds to allow price updates...');
    await new Promise(resolve => setTimeout(resolve, 10000));
    
    // Get trade details
    await getTrade(orderId);
    
    // Wait for another 5 seconds
    console.log('Waiting for 5 more seconds...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Square off the trade
    await squareOffTrade(orderId);
    
    // Get final trade details
    await getTrade(orderId);
    
    console.log('Test completed successfully!');
  } catch (error) {
    console.error('Test failed:', error);
  }
};

// Run the test if this file is executed directly
if (require.main === module) {
  runTest();
}

module.exports = {
  createTrade,
  getTrade,
  squareOffTrade,
  runTest
};
