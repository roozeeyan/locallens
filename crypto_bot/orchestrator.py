"""
Оркестратор — завод агентов.
- Создаёт начальных агентов
- Каждый час делает ревью с NEXUS
- Убивает неэффективных, запускает новых
"""
import asyncio
import time
import uuid
from loguru import logger

import config
from bybit_client import BybitClient
from agent import TradingAgent
import strategist


class Orchestrator:
    def __init__(self):
        self.bybit = BybitClient()
        self.agents: dict[str, TradingAgent] = {}
        self.total_capital = config.TOTAL_CAPITAL_USDT
        self._agent_tasks: dict[str, asyncio.Task] = {}
        self._last_review = 0.0

    def _capital_per_agent(self) -> float:
        """Равные доли капитала между слотами агентов."""
        return self.total_capital / config.MAX_AGENTS

    def _make_id(self, symbol: str) -> str:
        return f"{symbol[:3]}-{uuid.uuid4().hex[:6].upper()}"

    def _spawn_agent(self, symbol: str) -> TradingAgent:
        agent_id = self._make_id(symbol)
        capital = self._capital_per_agent()
        agent = TradingAgent(agent_id, symbol, capital, self.bybit)
        self.agents[agent_id] = agent
        task = asyncio.create_task(agent.run(), name=agent_id)
        self._agent_tasks[agent_id] = task
        logger.success(f"[ORCH] Запущен агент {agent_id} на {symbol}, капитал=${capital:.0f}")
        return agent

    def _kill_agent(self, agent_id: str, reason: str = ""):
        agent = self.agents.pop(agent_id, None)
        if agent:
            agent.stop()
            task = self._agent_tasks.pop(agent_id, None)
            if task and not task.done():
                task.cancel()
            logger.warning(f"[ORCH] Агент {agent_id} убит. Причина: {reason or 'N/A'}")
            # Возвращаем капитал в общий котёл
            self.total_capital += agent.capital

    async def run(self):
        logger.info(f"[ORCH] Запуск оркестратора. Капитал=${self.total_capital:.0f}, пар={config.TRADING_PAIRS}")

        # Стартуем по одному агенту на первые N пар
        initial_pairs = config.TRADING_PAIRS[:config.MAX_AGENTS]
        for symbol in initial_pairs:
            self._spawn_agent(symbol)

        logger.info(f"[ORCH] {len(self.agents)} агентов в работе. Первое ревью через {config.ORCHESTRATOR_REVIEW_SECONDS//60} мин.")

        while True:
            await asyncio.sleep(60)
            self._cleanup_dead_agents()

            if time.time() - self._last_review >= config.ORCHESTRATOR_REVIEW_SECONDS:
                await self._do_review()
                self._last_review = time.time()

    def _cleanup_dead_agents(self):
        dead = [aid for aid, task in self._agent_tasks.items() if task.done()]
        for aid in dead:
            if aid in self.agents:
                logger.info(f"[ORCH] Агент {aid} завершился сам (MAX_DRAWDOWN или ошибка)")
                agent = self.agents.pop(aid)
                self.total_capital += agent.capital
            self._agent_tasks.pop(aid, None)

    async def _do_review(self):
        if not self.agents:
            logger.warning("[ORCH] Нет активных агентов для ревью")
            return

        stats = [a.get_stats_dict() for a in self.agents.values()]
        logger.info(f"[ORCH] NEXUS ревью {len(stats)} агентов...")

        review = strategist.review_agents(stats)
        logger.info(f"[ORCH] NEXUS: {review.get('summary')}")

        # Убиваем слабых
        for aid in review.get("kill", []):
            if aid in self.agents:
                self._kill_agent(aid, "NEXUS рекомендовал убить")

        # Запускаем новых
        free_slots = config.MAX_AGENTS - len(self.agents)
        for new_spec in review.get("new_agents", [])[:free_slots]:
            symbol = new_spec.get("symbol", "")
            if symbol and symbol not in [a.symbol for a in self.agents.values()]:
                logger.info(f"[ORCH] Новый агент по рекомендации NEXUS: {symbol} — {new_spec.get('reason')}")
                self._spawn_agent(symbol)

        self._print_summary()

    def _print_summary(self):
        total = sum(a.capital for a in self.agents.values()) + (self.total_capital - sum(
            config.TOTAL_CAPITAL_USDT / config.MAX_AGENTS for _ in self.agents
        ))
        logger.info("=" * 60)
        logger.info(f"[ORCH] СТАТУС: {len(self.agents)} агентов активны")
        for agent in self.agents.values():
            s = agent.get_stats_dict()
            logger.info(
                f"  {s['id']:15} {s['symbol']:10} PnL={s['pnl_pct']:+.1f}% "
                f"сделок={s['trades']} w/l={s['wins']}/{s['losses']} "
                f"позиция={'ДА' if s['in_position'] else 'нет'}"
            )
        logger.info("=" * 60)
