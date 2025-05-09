/**
 * Test script for paper trading widget
 *
 * This script demonstrates how to use the API to:
 * 1. Create a new trade
 * 2. Get trade details
 * 3. Square off the trade
 */

const axios = require('axios');

const API_URL = 'http://localhost:5000/api';

// Sample trade data
const tradeData = {
  actId: 'XJZE1',
  exSeg: 'nse_fo',
  trdSym: 'NIFTY2540922400CE',
  sym: 'NIFTY',
  type: 'OPTIDX',
  optTp: 'CE',
  stkPrc: '24000.00',
  lotSz: 75,
  action: 'Buy', // Used to determine if it's a buy or sell
  tok: '43854',
  expiry: new Date(new Date().setMonth(new Date().getMonth() + 1)), // Next month expiry
  initialPrice: 86.67 // For testing purposes
};

// Create a new trade
const createTrade = async () => {
  try {
    console.log('Creating new trade...');
    const response = await axios.post(`${API_URL}/trades`, tradeData);

    console.log('Trade created successfully:');
    console.log(JSON.stringify(response.data, null, 2));

    return response.data.data._id;
  } catch (error) {
    console.error('Error creating trade:', error.response?.data || error.message);
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
const squareOffTrade = async (tradeId) => {
  try {
    console.log(`Squaring off trade with ID: ${tradeId}...`);
    const response = await axios.post(`${API_URL}/trades/${tradeId}/square-off`);

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
    const tradeId = await createTrade();

    // Wait for 10 seconds to allow some price updates
    console.log('Waiting for 10 seconds to allow price updates...');
    await new Promise(resolve => setTimeout(resolve, 10000));

    // Get trade details
    await getTrade(tradeId);

    // Wait for another 5 seconds
    console.log('Waiting for 5 more seconds...');
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Square off the trade
    await squareOffTrade(tradeId);

    // Get final trade details
    await getTrade(tradeId);

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
