const mongoose = require('mongoose');

const PaperOrderSchema = new mongoose.Schema({
  // Account and exchange details
  actId: {
    type: String,
    required: true,
    trim: true
  },
  exSeg: {
    type: String,
    required: true,
    trim: true,
    default: 'nse_fo'
  },
  
  // Contract details
  trdSym: {
    type: String,
    required: true,
    trim: true
  },
  sym: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    required: true,
    trim: true,
    default: 'OPTIDX'
  },
  optTp: {
    type: String,
    required: true,
    enum: ['CE', 'PE']
  },
  stkPrc: {
    type: String,
    required: true
  },
  
  // Quantity and amount details
  lotSz: {
    type: Number,
    required: true
  },
  flBuyQty: {
    type: Number,
    default: 0
  },
  flSellQty: {
    type: Number,
    default: 0
  },
  buyAmt: {
    type: Number,
    default: 0
  },
  sellAmt: {
    type: Number,
    default: 0
  },
  cfBuyQty: {
    type: Number,
    default: 0
  },
  cfSellQty: {
    type: Number,
    default: 0
  },
  cfBuyAmt: {
    type: Number,
    default: 0
  },
  cfSellAmt: {
    type: Number,
    default: 0
  },
  
  // Expiry and token
  expDt: {
    type: String,
    required: true
  },
  tok: {
    type: String,
    required: true
  },
  
  // Trade execution details
  entryTime: {
    type: Date,
    default: Date.now
  },
  entryPrice: {
    type: Number,
    required: true
  },
  exitTime: {
    type: Date,
    default: null
  },
  exitPrice: {
    type: Number,
    default: null
  },
  
  // Status and PnL
  status: {
    type: String,
    required: true,
    enum: ['open', 'closed'],
    default: 'open'
  },
  unrealizedPnL: {
    type: Number,
    default: 0
  },
  realizedPnL: {
    type: Number,
    default: null
  },
  
  // Last update timestamp
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  
  // For internal use - tracking current market price
  currentLTP: {
    type: Number,
    default: null
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('PaperOrder', PaperOrderSchema);
