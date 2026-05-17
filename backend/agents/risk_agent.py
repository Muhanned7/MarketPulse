import asyncio
import json
import yfinance as yf
import numpy as np
import random
from agents.client import client


MOCK_MODE = True
async def risk_agent(ticker: str) -> dict:
    if MOCK_MODE:
        await asyncio.sleep(0.5)  # Simulate network latency
        
        # Consistent seeding based on ticker
        seed = sum(ord(c) for c in ticker)
        random.seed(seed)
        
        # Logic to make the mock feel dynamic
        target_price = 225.50
        current_price = 192.25
        upside = round(((target_price / current_price) - 1) * 100, 2)

        return {
            "analyst_consensus": "strong_buy",
            "price_target": target_price,
            "upside_downside": f"{upside}% upside from current price",
            "competitive_position": "leader",
            "moat": "wide",
            "moat_sources": ["High switching costs", "Brand ecosystem", "Proprietary technology"],
            "growth_catalysts": ["Expansion into AI services", "Increased enterprise adoption"],
            "key_risks": ["Regulatory scrutiny on app store", "Supply chain concentration in Asia"],
            "sector_outlook": "positive",
            "investment_thesis": f"{ticker.upper()} maintains a dominant position in its core markets with industry-leading margins. The shift toward high-margin services provides a significant runway for earnings growth. We believe the current valuation does not fully account for its AI integration potential.",
            "summary": f"Analysts are overwhelmingly positive on {ticker}, citing a wide economic moat and strong cash flow generation. The consensus price target suggests double-digit upside. Overall, the stock remains a top pick for long-term growth-oriented portfolios."
        }
    def fetch_risk_data():
        stock = yf.Ticker(ticker)
        info = stock.info
        hist = stock.history(period="1y")

        if hist.empty:
            return None

        close = hist["Close"]
        daily_returns = close.pct_change().dropna()

        # Beta
        beta = info.get("beta")

        # Volatility (annualized)
        volatility = daily_returns.std() * np.sqrt(252)

        # Sharpe ratio (assuming risk free rate of 5%)
        risk_free_rate = 0.05
        avg_daily_return = daily_returns.mean()
        sharpe_ratio = (avg_daily_return * 252 - risk_free_rate) / (daily_returns.std() * np.sqrt(252))

        # Max drawdown
        rolling_max = close.cummax()
        drawdown = (close - rolling_max) / rolling_max
        max_drawdown = drawdown.min()

        # Value at Risk (95% confidence)
        var_95 = daily_returns.quantile(0.05)

        # Average True Range (ATR) for volatility
        high = hist["High"]
        low = hist["Low"]
        atr = (high - low).rolling(window=14).mean().iloc[-1]

        return {
            "beta": round(float(beta), 2) if beta else None,
            "annualized_volatility": round(float(volatility), 4),
            "sharpe_ratio": round(float(sharpe_ratio), 2),
            "max_drawdown": round(float(max_drawdown), 4),
            "var_95": round(float(var_95), 4),
            "atr_14": round(float(atr), 2),
            "short_ratio": info.get("shortRatio"),
            "shares_short": info.get("sharesShort"),
            "float_shares": info.get("floatShares"),
            "short_percent_of_float": info.get("shortPercentOfFloat"),
        }

    raw_data = await asyncio.to_thread(fetch_risk_data)

    if not raw_data:
        return {"error": "No data available"}

    response = await asyncio.to_thread(
        client.chat.complete,
        model="mistral-small-latest",
        messages=[
            {
                "role": "system",
                "content": """You are a risk management analyst. Given risk metrics, produce a thorough risk analysis.
                Return JSON with exactly these keys:
                {
                    "overall_risk": "low/medium/high/very_high",
                    "volatility_assessment": "low/medium/high",
                    "beta_assessment": "defensive/market_neutral/aggressive",
                    "sharpe_assessment": "poor/acceptable/good/excellent",
                    "short_squeeze_risk": "low/medium/high",
                    "key_risks": ["risk1", "risk2", "risk3"],
                    "risk_mitigants": ["mitigant1", "mitigant2"],
                    "max_drawdown_assessment": "mild/moderate/severe",
                    "var_interpretation": "one sentence explaining the VaR",
                    "metrics": {
                        "beta": 0.0,
                        "volatility": 0.0,
                        "sharpe_ratio": 0.0,
                        "max_drawdown": 0.0,
                        "var_95": 0.0
                    },
                    "summary": "3 sentence risk summary"
                }
                Return only raw JSON, no markdown."""
            },
            {
                "role": "user",
                "content": f"Analyze risk for {ticker}: {json.dumps(raw_data, default=str)}"
            }
        ]
    )

    raw = response.choices[0].message.content.replace("```json", "").replace("```", "").strip()
    return json.loads(raw)