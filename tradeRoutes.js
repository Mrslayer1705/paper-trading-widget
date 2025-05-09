const express = require('express');
const router = express.Router();
const {
  createTrade,
  squareOffTrade,
  getTrades,
  getTrade
} = require('../controllers/TradeController');

// Paper trading routes
router.route('/paper-trade/order')
  .post(createTrade);

router.route('/paper-trade/square-off')
  .post(squareOffTrade);

// Additional routes for getting trades
router.route('/trades')
  .get(getTrades);

router.route('/trades/:id')
  .get(getTrade);

module.exports = router;
