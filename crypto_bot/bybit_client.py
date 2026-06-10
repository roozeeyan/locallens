"""
Обёртка над Bybit API.
Спот-торговля: получение данных, выставление ордеров.
"""
import pandas as pd
from pybit.unified_trading import HTTP
from loguru import logger
import config


class BybitClient:
    def __init__(self):
        self.client = HTTP(
            testnet=config.BYBIT_TESTNET,
            api_key=config.BYBIT_API_KEY,
            api_secret=config.BYBIT_API_SECRET,
        )
        mode = "TESTNET" if config.BYBIT_TESTNET else "MAINNET"
        logger.info(f"Bybit клиент запущен ({mode})")

    def get_price(self, symbol: str) -> float:
        resp = self.client.get_tickers(category="spot", symbol=symbol)
        return float(resp["result"]["list"][0]["lastPrice"])

    def get_klines(self, symbol: str, interval: str = "15", limit: int = 200) -> pd.DataFrame:
        """
        interval: "1","3","5","15","30","60","120","240","D","W"
        Возвращает DataFrame с колонками: open, high, low, close, volume
        """
        resp = self.client.get_kline(
            category="spot",
            symbol=symbol,
            interval=interval,
            limit=limit,
        )
        rows = resp["result"]["list"]
        df = pd.DataFrame(rows, columns=["timestamp", "open", "high", "low", "close", "volume", "turnover"])
        df = df.astype({"open": float, "high": float, "low": float, "close": float, "volume": float})
        df["timestamp"] = pd.to_datetime(df["timestamp"].astype(int), unit="ms")
        df = df.sort_values("timestamp").reset_index(drop=True)
        return df

    def get_balance(self, coin: str = "USDT") -> float:
        resp = self.client.get_wallet_balance(accountType="UNIFIED", coin=coin)
        coins = resp["result"]["list"][0]["coin"]
        for c in coins:
            if c["coin"] == coin:
                return float(c["availableToWithdraw"])
        return 0.0

    def place_market_buy(self, symbol: str, usdt_amount: float) -> dict:
        """Купить на usdt_amount USDT по рыночной цене."""
        resp = self.client.place_order(
            category="spot",
            symbol=symbol,
            side="Buy",
            orderType="Market",
            quoteOrderQty=str(round(usdt_amount, 2)),
        )
        logger.info(f"BUY {symbol} на ${usdt_amount:.2f} → orderId={resp['result']['orderId']}")
        return resp["result"]

    def place_market_sell(self, symbol: str, qty: float) -> dict:
        """Продать qty монет по рыночной цене."""
        resp = self.client.place_order(
            category="spot",
            symbol=symbol,
            side="Sell",
            orderType="Market",
            qty=str(qty),
        )
        logger.info(f"SELL {symbol} qty={qty} → orderId={resp['result']['orderId']}")
        return resp["result"]

    def get_open_orders(self, symbol: str) -> list:
        resp = self.client.get_open_orders(category="spot", symbol=symbol)
        return resp["result"]["list"]
