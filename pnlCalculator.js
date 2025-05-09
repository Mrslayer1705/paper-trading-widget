/**
 * PnL Calculator Utility
 * 
 * Provides functions to calculate profit and loss for trades
 */

/**
 * Calculate PnL based on action, entry price, current price, and lot size
 * 
 * @param {string} action - 'Buy' or 'Sell'
 * @param {number} entryPrice - Price at which the trade was entered
 * @param {number} currentPrice - Current market price
 * @param {number} lotSize - Number of lots
 * @returns {number} - Calculated PnL
 */
const calculatePnL = (action, entryPrice, currentPrice, lotSize) => {
  if (action === 'Buy') {
    // For Buy trades: (currentPrice - entryPrice) * lotSize
    return (currentPrice - entryPrice) * lotSize;
  } else if (action === 'Sell') {
    // For Sell trades: (entryPrice - currentPrice) * lotSize
    return (entryPrice - currentPrice) * lotSize;
  } else {
    throw new Error(`Invalid action: ${action}`);
  }
};

/**
 * Calculate percentage PnL
 * 
 * @param {number} pnl - Absolute PnL
 * @param {number} investment - Initial investment amount
 * @returns {number} - Percentage PnL
 */
const calculatePercentagePnL = (pnl, investment) => {
  if (investment === 0) return 0;
  return (pnl / investment) * 100;
};

module.exports = {
  calculatePnL,
  calculatePercentagePnL
};
