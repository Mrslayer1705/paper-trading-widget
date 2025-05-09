/**
 * Trade Service
 *
 * This service is responsible for:
 * 1. Processing trade signals
 * 2. Locking entry prices
 * 3. Storing orders in MongoDB
 * 4. Handling square-off operations
 */

const PaperOrder = require('../models/PaperOrder');
const MarketDataService = require('./MarketDataService');
const { calculatePnL } = require('../utils/pnlCalculator');
const moment = require('moment');

class TradeService {
  constructor(io) {
    this.io = io;
    this.marketDataService = new MarketDataService(io);
  }

  /**
   * Process a new trade signal
   */
  async processTrade(tradeSignal) {
    try {
      // Validate trade signal
      this.validateTradeSignal(tradeSignal);

      // Get current LTP as entry price
      const entryPrice = await this.marketDataService.getCurrentLTP(
        tradeSignal.tok,
        tradeSignal.initialPrice // Optional: can be used for testing
      );

      // Format expiry date
      const expiryDate = moment(tradeSignal.expiry).format('DD MMM, YYYY');

      // Determine if it's a buy or sell order
      const isBuy = tradeSignal.action === 'Buy';

      // Create new paper order in database
      const paperOrder = new PaperOrder({
        actId: tradeSignal.actId || 'XJZE1', // Default account ID if not provided
        exSeg: tradeSignal.exSeg || 'nse_fo',
        trdSym: tradeSignal.trdSym,
        sym: tradeSignal.sym,
        type: tradeSignal.type || 'OPTIDX',
        optTp: tradeSignal.optTp,
        stkPrc: tradeSignal.stkPrc,
        lotSz: tradeSignal.lotSz,
        flBuyQty: isBuy ? tradeSignal.lotSz : 0,
        flSellQty: !isBuy ? tradeSignal.lotSz : 0,
        buyAmt: isBuy ? entryPrice * tradeSignal.lotSz : 0,
        sellAmt: !isBuy ? entryPrice * tradeSignal.lotSz : 0,
        cfBuyQty: 0,
        cfSellQty: 0,
        cfBuyAmt: 0,
        cfSellAmt: 0,
        expDt: expiryDate,
        tok: tradeSignal.tok,
        entryTime: new Date(),
        entryPrice,
        exitTime: null,
        exitPrice: null,
        status: 'open',
        unrealizedPnL: 0,
        realizedPnL: null,
        lastUpdated: new Date(),
        currentLTP: entryPrice
      });

      // Save paper order to database
      await paperOrder.save();

      // Subscribe to market data updates for this token
      this.marketDataService.subscribe(tradeSignal.tok);

      // Emit trade confirmation
      this.io.emit('trade-executed', {
        orderId: paperOrder._id,
        entryPrice,
        action: isBuy ? 'Buy' : 'Sell',
        symbol: paperOrder.sym,
        strike: paperOrder.stkPrc,
        optionType: paperOrder.optTp
      });

      return paperOrder;
    } catch (error) {
      console.error('Error processing trade:', error);
      throw error;
    }
  }

  /**
   * Validate trade signal parameters
   */
  validateTradeSignal(tradeSignal) {
    const requiredFields = [
      'sym', 'stkPrc', 'optTp', 'action',
      'lotSz', 'tok', 'expiry', 'trdSym'
    ];

    for (const field of requiredFields) {
      if (!tradeSignal[field]) {
        throw new Error(`Missing required field: ${field}`);
      }
    }

    if (!['CE', 'PE'].includes(tradeSignal.optTp)) {
      throw new Error('Option type must be CE or PE');
    }

    if (!['Buy', 'Sell'].includes(tradeSignal.action)) {
      throw new Error('Action must be Buy or Sell');
    }

    if (isNaN(tradeSignal.lotSz) || tradeSignal.lotSz <= 0) {
      throw new Error('Lot size must be a positive number');
    }

    // Validate expiry date
    const expiry = new Date(tradeSignal.expiry);
    if (isNaN(expiry.getTime())) {
      throw new Error('Invalid expiry date');
    }
  }

  /**
   * Process square-off signal
   */
  async processSquareOff(orderId) {
    try {
      // Find paper order
      const order = await PaperOrder.findById(orderId);

      if (!order) {
        throw new Error(`Order not found: ${orderId}`);
      }

      if (order.status === 'closed') {
        throw new Error(`Order already closed: ${orderId}`);
      }

      // Get current LTP as exit price
      const exitPrice = await this.marketDataService.getCurrentLTP(order.tok);

      // Determine if it was a buy or sell order
      const isBuy = order.flBuyQty > 0;

      // Calculate realized PnL
      let realizedPnL;
      if (isBuy) {
        // For Buy trades: (exitPrice - entryPrice) * quantity
        realizedPnL = (exitPrice - order.entryPrice) * order.flBuyQty;
      } else {
        // For Sell trades: (entryPrice - exitPrice) * quantity
        realizedPnL = (order.entryPrice - exitPrice) * order.flSellQty;
      }

      // Update order
      const updatedOrder = await PaperOrder.findByIdAndUpdate(
        orderId,
        {
          exitPrice,
          exitTime: new Date(),
          realizedPnL,
          status: 'closed',
          lastUpdated: new Date()
        },
        { new: true }
      );

      // Emit square-off confirmation
      this.io.emit('trade-squared-off', {
        orderId,
        exitPrice,
        realizedPnL,
        entryPrice: order.entryPrice
      });

      // Unsubscribe from market updates if no more open orders with this token
      const openOrders = await PaperOrder.countDocuments({
        tok: order.tok,
        status: 'open'
      });

      if (openOrders === 0) {
        this.marketDataService.unsubscribe(order.tok);
      }

      return updatedOrder;
    } catch (error) {
      console.error('Error processing square-off:', error);
      throw error;
    }
  }

  /**
   * Get all active trades
   */
  async getActiveTrades() {
    return await PaperOrder.find({ status: 'open' });
  }
}

module.exports = TradeService;
