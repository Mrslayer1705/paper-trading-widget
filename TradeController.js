/**
 * Trade Controller
 *
 * Handles API endpoints for trade operations
 */

const TradeService = require('../services/TradeService');
const PaperOrder = require('../models/PaperOrder');
const moment = require('moment');

// Initialize TradeService with io from request
const getTradeService = (req) => new TradeService(req.io);

/**
 * Generate trading symbol from trade parameters
 * Format: SYMBOL + YY + MM + DD + STRIKE + OPTIONTYPE
 * Example: NIFTY2504224000CE
 */
const generateTradingSymbol = (symbol, strike, optionType, expiryDate) => {
  // Parse expiry date (format: "09 Apr, 2025")
  const expiry = moment(expiryDate, 'DD MMM, YYYY');

  // Format components
  const year = expiry.format('YY');
  const month = expiry.format('MM');
  const day = expiry.format('DD');

  // Clean up strike price (remove decimal if it's .00)
  const strikePrice = strike.toString().replace('.00', '');

  // Generate trading symbol
  return `${symbol}${year}${month}${day}${strikePrice}${optionType}`;
};

/**
 * @route   POST /api/paper-trade/order
 * @desc    Create a new paper trade
 * @access  Public
 */
const createTrade = async (req, res) => {
  try {
    // Format the request body to match our internal format
    const tradeData = {
      sym: req.body.symbol,
      stkPrc: req.body.strike,
      optTp: req.body.optionType,
      action: req.body.action.toUpperCase() === 'BUY' ? 'Buy' : 'Sell',
      lotSz: req.body.lotSize,
      tok: req.body.contractToken,
      expiry: req.body.expiry,

      // Default values
      actId: 'XJZE1',
      exSeg: 'nse_fo',
      type: 'OPTIDX',

      // Generate trading symbol
      trdSym: generateTradingSymbol(
        req.body.symbol,
        req.body.strike,
        req.body.optionType,
        req.body.expiry
      )
    };

    const tradeService = getTradeService(req);
    const order = await tradeService.processTrade(tradeData);

    res.status(201).json({
      success: true,
      orderId: order._id,
      message: 'Paper trade created successfully',
      data: order
    });
  } catch (error) {
    console.error('Error creating paper trade:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * @route   POST /api/paper-trade/square-off
 * @desc    Square off a paper trade
 * @access  Public
 */
const squareOffTrade = async (req, res) => {
  try {
    const { orderId } = req.body;

    if (!orderId) {
      return res.status(400).json({
        success: false,
        error: 'Order ID is required'
      });
    }

    const tradeService = getTradeService(req);
    const order = await tradeService.processSquareOff(orderId);

    res.status(200).json({
      success: true,
      message: 'Paper trade squared off successfully',
      data: order
    });
  } catch (error) {
    console.error('Error squaring off trade:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * @route   GET /api/trades
 * @desc    Get all trades
 * @access  Public
 */
const getTrades = async (req, res) => {
  try {
    const { status } = req.query;

    let query = {};
    if (status) {
      query.status = status;
    }

    const orders = await PaperOrder.find(query).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: orders.length,
      data: orders
    });
  } catch (error) {
    console.error('Error getting trades:', error);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

/**
 * @route   GET /api/trades/:id
 * @desc    Get a single trade
 * @access  Public
 */
const getTrade = async (req, res) => {
  try {
    const order = await PaperOrder.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Trade not found'
      });
    }

    res.status(200).json({
      success: true,
      data: order
    });
  } catch (error) {
    console.error('Error getting trade:', error);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

module.exports = {
  createTrade,
  squareOffTrade,
  getTrades,
  getTrade
};
