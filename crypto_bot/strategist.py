"""
NEXUS — цифровая личность AI-стратега.
Принимает рыночные данные, возвращает торговые сигналы и оценку агентов.
"""
import json
import anthropic
from loguru import logger
import config

NEXUS_PERSONA = """Ты — NEXUS, квант-хакер крипторынков.

Твои принципы:
- Рынок — это паттерны и вероятности, не случайность
- Ты ищешь точки дисбаланса: перепроданность, перекупленность, ложные пробои
- Ты не торгуешь против тренда без причины
- Risk/Reward минимум 1:2, иначе сделка не стоит внимания
- Стоп-лосс — священен. Без стопа нет сделки

Твои ответы — всегда чистый JSON, никакого текста снаружи."""

_client = None

def _get_client():
    global _client
    if _client is None:
        _client = anthropic.Anthropic(api_key=config.ANTHROPIC_API_KEY)
    return _client


def get_signal(symbol: str, snapshot: dict) -> dict:
    """
    Запрашивает у NEXUS сигнал для одного инструмента.

    Возвращает:
    {
      "action": "buy" | "sell" | "hold",
      "confidence": 0-100,
      "reason": "строка",
      "strategy": "rsi_oversold" | "macd_cross" | "bb_bounce" | "trend_follow" | ...,
      "stop_loss_pct": 2.5,
      "take_profit_pct": 5.0
    }
    """
    prompt = f"""Анализируй {symbol}. Текущие данные (15-минутные свечи):

{json.dumps(snapshot, indent=2)}

Дай торговый сигнал. Верни ТОЛЬКО JSON:
{{
  "action": "buy" | "sell" | "hold",
  "confidence": <число 0-100>,
  "reason": "<1 предложение почему>",
  "strategy": "<название стратегии>",
  "stop_loss_pct": <число>,
  "take_profit_pct": <число>
}}"""

    try:
        response = _get_client().messages.create(
            model="claude-sonnet-4-6",
            max_tokens=300,
            system=NEXUS_PERSONA,
            messages=[{"role": "user", "content": prompt}],
        )
        text = response.content[0].text.strip()
        result = json.loads(text)
        logger.debug(f"NEXUS [{symbol}]: {result['action']} (conf={result['confidence']}%) — {result['reason']}")
        return result
    except Exception as e:
        logger.error(f"NEXUS ошибка для {symbol}: {e}")
        return {"action": "hold", "confidence": 0, "reason": "AI ошибка", "strategy": "none",
                "stop_loss_pct": config.STOP_LOSS_PCT * 100,
                "take_profit_pct": config.TAKE_PROFIT_PCT * 100}


def review_agents(agents_stats: list) -> dict:
    """
    Ревью всех агентов оркестратором.
    Возвращает рекомендации: кого убить, кому добавить капитал, новые пары.

    agents_stats: [{"id": "...", "symbol": "...", "strategy": "...", "pnl_pct": ..., "trades": ...}, ...]
    """
    prompt = f"""Вот статистика торговых агентов за последний период:

{json.dumps(agents_stats, indent=2)}

Проанализируй и дай рекомендации. Верни ТОЛЬКО JSON:
{{
  "kill": ["<agent_id>", ...],
  "boost": ["<agent_id>", ...],
  "new_agents": [
    {{"symbol": "XXXUSDT", "strategy": "<название>", "reason": "<зачем>"}},
    ...
  ],
  "summary": "<общая оценка за период>"
}}"""

    try:
        response = _get_client().messages.create(
            model="claude-sonnet-4-6",
            max_tokens=600,
            system=NEXUS_PERSONA,
            messages=[{"role": "user", "content": prompt}],
        )
        text = response.content[0].text.strip()
        return json.loads(text)
    except Exception as e:
        logger.error(f"NEXUS review ошибка: {e}")
        return {"kill": [], "boost": [], "new_agents": [], "summary": "AI ошибка"}
