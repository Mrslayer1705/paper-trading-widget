/**
 * Paper Trading Widget Demo
 * 
 * This script demonstrates how the paper trading widget would work
 * by simulating the API calls and responses.
 */

const moment = require('moment');

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

// Simulate creating a paper trade
const createTrade = () => {
  console.log('\n=== Creating Paper Trade ===');
  console.log('Request to POST /api/paper-trade/order');
  console.log('Request Body:');
  console.log(JSON.stringify(tradeData, null, 2));
  
  // Simulate response
  const orderId = 'ord_' + Math.random().toString(36).substring(2, 10);
  const response = {
    success: true,
    orderId,
    message: 'Paper trade created successfully',
    data: {
      _id: orderId,
      actId: 'XJZE1',
      exSeg: 'nse_fo',
      trdSym: `NIFTY${nextMonth.format('YYMMDD')}24000CE`,
      sym: 'NIFTY',
      type: 'OPTIDX',
      optTp: 'CE',
      stkPrc: '24000.00',
      lotSz: 75,
      flBuyQty: 75,
      flSellQty: 0,
      buyAmt: 6500.25,
      sellAmt: 0,
      cfBuyQty: 0,
      cfSellQty: 0,
      cfBuyAmt: 0,
      cfSellAmt: 0,
      expDt: expiryDate,
      tok: '43854',
      entryTime: new Date().toISOString(),
      entryPrice: 86.67,
      exitTime: null,
      exitPrice: null,
      status: 'open',
      unrealizedPnL: 0,
      realizedPnL: null,
      lastUpdated: new Date().toISOString(),
      currentLTP: 86.67
    }
  };
  
  console.log('\nResponse:');
  console.log(JSON.stringify(response, null, 2));
  
  return orderId;
};

// Simulate getting trade details
const getTrade = (orderId) => {
  console.log('\n=== Getting Trade Details ===');
  console.log(`Request to GET /api/trades/${orderId}`);
  
  // Simulate response with updated price and PnL
  const currentLTP = (86.67 + (Math.random() * 4 - 2)).toFixed(2);
  const unrealizedPnL = ((currentLTP - 86.67) * 75).toFixed(2);
  
  const response = {
    success: true,
    data: {
      _id: orderId,
      actId: 'XJZE1',
      exSeg: 'nse_fo',
      trdSym: `NIFTY${nextMonth.format('YYMMDD')}24000CE`,
      sym: 'NIFTY',
      type: 'OPTIDX',
      optTp: 'CE',
      stkPrc: '24000.00',
      lotSz: 75,
      flBuyQty: 75,
      flSellQty: 0,
      buyAmt: 6500.25,
      sellAmt: 0,
      cfBuyQty: 0,
      cfSellQty: 0,
      cfBuyAmt: 0,
      cfSellAmt: 0,
      expDt: expiryDate,
      tok: '43854',
      entryTime: new Date(Date.now() - 15000).toISOString(),
      entryPrice: 86.67,
      exitTime: null,
      exitPrice: null,
      status: 'open',
      unrealizedPnL: parseFloat(unrealizedPnL),
      realizedPnL: null,
      lastUpdated: new Date().toISOString(),
      currentLTP: parseFloat(currentLTP)
    }
  };
  
  console.log('\nResponse:');
  console.log(JSON.stringify(response, null, 2));
  
  return response.data;
};

// Simulate squaring off a trade
const squareOffTrade = (orderId) => {
  console.log('\n=== Squaring Off Trade ===');
  console.log('Request to POST /api/paper-trade/square-off');
  console.log('Request Body:');
  console.log(JSON.stringify({ orderId }, null, 2));
  
  // Simulate response with exit price and realized PnL
  const exitPrice = (86.67 + (Math.random() * 6 - 3)).toFixed(2);
  const realizedPnL = ((exitPrice - 86.67) * 75).toFixed(2);
  
  const response = {
    success: true,
    message: 'Paper trade squared off successfully',
    data: {
      _id: orderId,
      actId: 'XJZE1',
      exSeg: 'nse_fo',
      trdSym: `NIFTY${nextMonth.format('YYMMDD')}24000CE`,
      sym: 'NIFTY',
      type: 'OPTIDX',
      optTp: 'CE',
      stkPrc: '24000.00',
      lotSz: 75,
      flBuyQty: 75,
      flSellQty: 0,
      buyAmt: 6500.25,
      sellAmt: 0,
      cfBuyQty: 0,
      cfSellQty: 0,
      cfBuyAmt: 0,
      cfSellAmt: 0,
      expDt: expiryDate,
      tok: '43854',
      entryTime: new Date(Date.now() - 30000).toISOString(),
      entryPrice: 86.67,
      exitTime: new Date().toISOString(),
      exitPrice: parseFloat(exitPrice),
      status: 'closed',
      unrealizedPnL: 0,
      realizedPnL: parseFloat(realizedPnL),
      lastUpdated: new Date().toISOString(),
      currentLTP: parseFloat(exitPrice)
    }
  };
  
  console.log('\nResponse:');
  console.log(JSON.stringify(response, null, 2));
  
  return response.data;
};

// Simulate WebSocket events
const simulateWebSocketEvents = (orderId) => {
  console.log('\n=== WebSocket Events ===');
  
  // Simulate trade-executed event
  console.log('\nEvent: trade-executed');
  console.log(JSON.stringify({
    orderId,
    entryPrice: 86.67,
    action: 'Buy',
    symbol: 'NIFTY',
    strike: '24000.00',
    optionType: 'CE'
  }, null, 2));
  
  // Simulate market-update event
  console.log('\nEvent: market-update:43854');
  console.log(JSON.stringify({
    token: '43854',
    ltp: 87.25
  }, null, 2));
  
  // Simulate pnl-update event
  console.log('\nEvent: pnl-update:' + orderId);
  console.log(JSON.stringify({
    orderId,
    currentLTP: 87.25,
    unrealizedPnL: (87.25 - 86.67) * 75
  }, null, 2));
  
  // Simulate trade-squared-off event
  console.log('\nEvent: trade-squared-off');
  console.log(JSON.stringify({
    orderId,
    exitPrice: 88.50,
    realizedPnL: (88.50 - 86.67) * 75,
    entryPrice: 86.67
  }, null, 2));
};

// Run the demo
const runDemo = async () => {
  console.log('=== Paper Trading Widget Demo ===\n');
  
  // Create a trade
  const orderId = createTrade();
  
  // Wait for 2 seconds
  console.log('\nWaiting for 2 seconds to simulate market data updates...');
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Get trade details
  getTrade(orderId);
  
  // Wait for 2 more seconds
  console.log('\nWaiting for 2 more seconds...');
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Square off the trade
  squareOffTrade(orderId);
  
  // Simulate WebSocket events
  simulateWebSocketEvents(orderId);
  
  console.log('\n=== Demo Completed ===');
};

// Run the demo
runDemo();
