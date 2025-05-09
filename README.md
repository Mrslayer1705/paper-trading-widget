# Paper Trading Widget

A modular widget for a paper trading system that handles trade signals, tracks market prices, and calculates PnL in real-time.

## Features

- Accepts trade signals (e.g., NIFTY 24000 CE Buy)
- Locks the current LTP as entry price
- Saves orders to MongoDB using the specified schema
- Tracks running market price (LTP updates) using Kotak/Dhan API
- Publishes PnL changes in real-time
- Handles square-off signals to settle contracts

## Setup

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Create a `.env` file based on `.env.example`
4. Start the server:
   ```
   npm run dev
   ```

## API Endpoints

### Create a Paper Trade
```
POST /api/paper-trade/order
```
Request body:
```json
{
  "symbol": "NIFTY",
  "strike": "24000",
  "optionType": "CE",
  "action": "BUY",
  "lotSize": 75,
  "contractToken": "43854",
  "expiry": "09 Apr, 2025"
}
```

### Square Off a Paper Trade
```
POST /api/paper-trade/square-off
```
Request body:
```json
{
  "orderId": "abc123"
}
```

### Get All Trades
```
GET /api/trades
```
Query parameters:
- `status`: Filter by status (`open` or `closed`)

### Get a Single Trade
```
GET /api/trades/:id
```

## WebSocket Events

### Client Events
- `connection`: Client connects to the server
- `disconnect`: Client disconnects from the server

### Server Events
- `trade-executed`: Emitted when a new trade is executed
- `pnl-update:{contractId}`: Emitted when PnL changes for a contract
- `market-update:{contractToken}`: Emitted when market price updates
- `trade-squared-off`: Emitted when a trade is squared off

## Architecture

The widget is built with a modular architecture:

- **TradeService**: Handles trade signal processing and square-off operations
- **MarketDataService**: Manages market data feeds and price updates
- **MarketDataProvider**: Connects to Kotak/Dhan API for real market data
- **PnL Calculator**: Utility for calculating profit and loss
- **MongoDB Models**: Schema for storing paper order data
- **WebSocket**: Real-time communication for price and PnL updates

## Market Data Integration

The widget can be configured to use either Kotak or Dhan API for real market data:

1. Set the `MARKET_DATA_PROVIDER` environment variable to either `kotak` or `dhan`
2. Configure the respective API credentials in the `.env` file
3. Set `USE_MOCK_DATA=false` to use the real market data feed

## Testing

For testing purposes, the widget can simulate market data with random price movements by setting `USE_MOCK_DATA=true` in the `.env` file. In a production environment, this would be replaced with a real market data feed from Kotak or Dhan API.

Run the test script to verify the API functionality:
```
node test/testPaperTrade.js
```
