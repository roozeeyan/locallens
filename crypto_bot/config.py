import os
from dotenv import load_dotenv

load_dotenv()

BYBIT_API_KEY = os.getenv("BYBIT_API_KEY", "")
BYBIT_API_SECRET = os.getenv("BYBIT_API_SECRET", "")
BYBIT_TESTNET = os.getenv("BYBIT_TESTNET", "true").lower() == "true"

ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY", "")

TOTAL_CAPITAL_USDT = float(os.getenv("TOTAL_CAPITAL_USDT", "1000"))
MAX_AGENTS = int(os.getenv("MAX_AGENTS", "4"))
TRADING_PAIRS = os.getenv("TRADING_PAIRS", "BTCUSDT,ETHUSDT,SOLUSDT").split(",")

# Риск-менеджмент
STOP_LOSS_PCT = 0.03       # -3% = стоп
TAKE_PROFIT_PCT = 0.06     # +6% = тейк
MAX_DRAWDOWN_PCT = 0.12    # -12% = убиваем агента

# Тайминги
AGENT_LOOP_SECONDS = 60           # Каждые 60 сек агент смотрит рынок
ORCHESTRATOR_REVIEW_SECONDS = 3600  # Каждый час оркестратор делает ревью с AI
