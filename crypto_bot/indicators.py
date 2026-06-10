"""
Технические индикаторы — вычисляются из DataFrame с ценами.
"""
import pandas as pd
import pandas_ta as ta


def add_all_indicators(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()
    df.ta.rsi(length=14, append=True)           # RSI_14
    df.ta.macd(append=True)                      # MACD_12_26_9, MACDh_12_26_9, MACDs_12_26_9
    df.ta.ema(length=20, append=True)            # EMA_20
    df.ta.ema(length=50, append=True)            # EMA_50
    df.ta.bbands(length=20, append=True)         # BBL_20_2.0, BBM_20_2.0, BBU_20_2.0
    df.ta.atr(length=14, append=True)            # ATRr_14
    df.ta.stoch(append=True)                     # STOCHk_14_3_3, STOCHd_14_3_3
    df.ta.adx(append=True)                       # ADX_14
    return df


def get_snapshot(df: pd.DataFrame) -> dict:
    """
    Последние значения всех индикаторов — удобно передавать в AI.
    """
    df = add_all_indicators(df)
    last = df.iloc[-1]
    prev = df.iloc[-2]

    return {
        "price": round(float(last["close"]), 4),
        "price_change_pct": round((float(last["close"]) - float(prev["close"])) / float(prev["close"]) * 100, 3),
        "volume_24h": round(float(df.tail(96)["volume"].sum()), 2),  # 96 × 15min = 24h
        "rsi": round(float(last.get("RSI_14", 50)), 2),
        "macd": round(float(last.get("MACD_12_26_9", 0)), 6),
        "macd_signal": round(float(last.get("MACDs_12_26_9", 0)), 6),
        "macd_hist": round(float(last.get("MACDh_12_26_9", 0)), 6),
        "ema20": round(float(last.get("EMA_20", 0)), 4),
        "ema50": round(float(last.get("EMA_50", 0)), 4),
        "bb_upper": round(float(last.get("BBU_20_2.0", 0)), 4),
        "bb_lower": round(float(last.get("BBL_20_2.0", 0)), 4),
        "atr": round(float(last.get("ATRr_14", 0)), 4),
        "stoch_k": round(float(last.get("STOCHk_14_3_3", 50)), 2),
        "adx": round(float(last.get("ADX_14", 0)), 2),
        "trend": "up" if float(last.get("EMA_20", 0)) > float(last.get("EMA_50", 0)) else "down",
    }
