"""
Точка входа.
Запуск: python main.py
"""
import asyncio
import sys
from loguru import logger
import config
from orchestrator import Orchestrator


def check_config():
    errors = []
    if not config.BYBIT_API_KEY:
        errors.append("BYBIT_API_KEY не задан")
    if not config.BYBIT_API_SECRET:
        errors.append("BYBIT_API_SECRET не задан")
    if not config.ANTHROPIC_API_KEY:
        errors.append("ANTHROPIC_API_KEY не задан")
    if errors:
        for e in errors:
            logger.error(f"Конфиг: {e}")
        logger.error("Скопируй .env.example → .env и заполни ключи")
        sys.exit(1)


async def main():
    logger.remove()
    logger.add(sys.stderr, format="<green>{time:HH:mm:ss}</green> | <level>{level:8}</level> | {message}", level="DEBUG")
    logger.add("logs/bot.log", rotation="1 day", retention="7 days", level="INFO")

    logger.info("=" * 60)
    logger.info(" LocalLens Crypto Bot — запуск")
    logger.info(f" Капитал: ${config.TOTAL_CAPITAL_USDT:.0f} USDT")
    logger.info(f" Пары: {', '.join(config.TRADING_PAIRS)}")
    logger.info(f" Режим: {'TESTNET 🧪' if config.BYBIT_TESTNET else 'MAINNET ⚡'}")
    logger.info("=" * 60)

    check_config()

    orch = Orchestrator()
    try:
        await orch.run()
    except KeyboardInterrupt:
        logger.info("Получен Ctrl+C, завершаю...")
    except Exception as e:
        logger.exception(f"Критическая ошибка: {e}")
    finally:
        logger.info("Бот остановлен.")


if __name__ == "__main__":
    import os
    os.makedirs("logs", exist_ok=True)
    asyncio.run(main())
