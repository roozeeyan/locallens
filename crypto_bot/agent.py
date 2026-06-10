"""
Торговый агент — независимая единица.
Каждый агент:
- Следит за одной парой
- Спрашивает NEXUS каждые N секунд
- Исполняет сигналы на Bybit
- Управляет позицией (стоп/тейк)
"""
import asyncio
import time
from dataclasses import dataclass, field
from loguru import logger

import config
from bybit_client import BybitClient
from indicators import get_snapshot
import strategist


@dataclass
class Position:
    symbol: str
    qty: float
    entry_price: float
    stop_loss: float
    take_profit: float
    opened_at: float = field(default_factory=time.time)


@dataclass
class AgentStats:
    trades: int = 0
    wins: int = 0
    losses: int = 0
    total_pnl_usdt: float = 0.0
    peak_capital: float = 0.0


class TradingAgent:
    def __init__(self, agent_id: str, symbol: str, capital_usdt: float, bybit: BybitClient):
        self.id = agent_id
        self.symbol = symbol
        self.capital = capital_usdt
        self.bybit = bybit
        self.position: Position | None = None
        self.stats = AgentStats(peak_capital=capital_usdt)
        self.running = False
        self._start_capital = capital_usdt
        logger.info(f"[{self.id}] Агент запущен: {symbol}, капитал=${capital_usdt:.0f}")

    @property
    def pnl_pct(self) -> float:
        return (self.capital - self._start_capital) / self._start_capital * 100

    @property
    def drawdown_pct(self) -> float:
        if self.stats.peak_capital == 0:
            return 0.0
        return (self.stats.peak_capital - self.capital) / self.stats.peak_capital * 100

    def get_stats_dict(self) -> dict:
        return {
            "id": self.id,
            "symbol": self.symbol,
            "capital": round(self.capital, 2),
            "pnl_pct": round(self.pnl_pct, 2),
            "drawdown_pct": round(self.drawdown_pct, 2),
            "trades": self.stats.trades,
            "wins": self.stats.wins,
            "losses": self.stats.losses,
            "in_position": self.position is not None,
        }

    async def run(self):
        self.running = True
        while self.running:
            try:
                await self._tick()
            except Exception as e:
                logger.error(f"[{self.id}] Ошибка в тике: {e}")
            await asyncio.sleep(config.AGENT_LOOP_SECONDS)

    async def _tick(self):
        if self.drawdown_pct >= config.MAX_DRAWDOWN_PCT * 100:
            logger.warning(f"[{self.id}] MAX DRAWDOWN достигнут ({self.drawdown_pct:.1f}%), останавливаюсь")
            await self._close_position("MAX_DRAWDOWN")
            self.running = False
            return

        if self.position:
            await self._manage_position()
        else:
            await self._look_for_entry()

    async def _look_for_entry(self):
        df = self.bybit.get_klines(self.symbol, interval="15", limit=200)
        snapshot = get_snapshot(df)
        signal = strategist.get_signal(self.symbol, snapshot)

        if signal["action"] == "buy" and signal["confidence"] >= 60:
            await self._open_long(signal)

    async def _open_long(self, signal: dict):
        price = self.bybit.get_price(self.symbol)
        usdt_to_spend = self.capital * 0.95  # оставляем 5% на комиссии
        if usdt_to_spend < 10:
            logger.warning(f"[{self.id}] Мало капитала: ${usdt_to_spend:.2f}")
            return

        sl_pct = signal.get("stop_loss_pct", config.STOP_LOSS_PCT * 100) / 100
        tp_pct = signal.get("take_profit_pct", config.TAKE_PROFIT_PCT * 100) / 100

        order = self.bybit.place_market_buy(self.symbol, usdt_to_spend)
        qty = float(order.get("qty", usdt_to_spend / price))

        self.position = Position(
            symbol=self.symbol,
            qty=qty,
            entry_price=price,
            stop_loss=price * (1 - sl_pct),
            take_profit=price * (1 + tp_pct),
        )
        logger.success(
            f"[{self.id}] ОТКРЫЛ LONG {self.symbol} @ {price:.4f} | "
            f"SL={self.position.stop_loss:.4f} TP={self.position.take_profit:.4f} | "
            f"Стратегия: {signal.get('strategy')} — {signal.get('reason')}"
        )

    async def _manage_position(self):
        price = self.bybit.get_price(self.symbol)
        pos = self.position

        if price <= pos.stop_loss:
            pnl = (price - pos.entry_price) / pos.entry_price * 100
            logger.warning(f"[{self.id}] СТОП-ЛОСС @ {price:.4f} (PnL={pnl:.2f}%)")
            await self._close_position("STOP_LOSS")

        elif price >= pos.take_profit:
            pnl = (price - pos.entry_price) / pos.entry_price * 100
            logger.success(f"[{self.id}] ТЕЙК-ПРОФИТ @ {price:.4f} (PnL={pnl:.2f}%)")
            await self._close_position("TAKE_PROFIT")

        else:
            unrealized = (price - pos.entry_price) / pos.entry_price * 100
            logger.debug(f"[{self.id}] Держим {self.symbol} @ {price:.4f} | unrealized={unrealized:+.2f}%")

    async def _close_position(self, reason: str):
        if not self.position:
            return
        pos = self.position
        try:
            self.bybit.place_market_sell(pos.symbol, pos.qty)
            close_price = self.bybit.get_price(pos.symbol)
            pnl_usdt = (close_price - pos.entry_price) * pos.qty
            pnl_pct = (close_price - pos.entry_price) / pos.entry_price * 100

            self.capital += pnl_usdt
            self.stats.trades += 1
            self.stats.total_pnl_usdt += pnl_usdt
            if pnl_usdt >= 0:
                self.stats.wins += 1
            else:
                self.stats.losses += 1

            if self.capital > self.stats.peak_capital:
                self.stats.peak_capital = self.capital

            logger.info(
                f"[{self.id}] ЗАКРЫЛ {reason}: PnL={pnl_pct:+.2f}% (${pnl_usdt:+.2f}) | "
                f"Капитал=${self.capital:.2f} | Всего сделок={self.stats.trades}"
            )
        except Exception as e:
            logger.error(f"[{self.id}] Ошибка закрытия позиции: {e}")
        finally:
            self.position = None

    def stop(self):
        self.running = False
