from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from pydantic import BaseModel
import asyncio
import json
from auth import hash_password, verify_password, create_token, get_current_user
from agents.db import query
import os

load_dotenv()


from agents.news_agent import news_agent
from agents.sentiment_agent import sentiment_agent
from agents.technical_agent import technical_agent
from agents.fundamentals_agent import fundamentals_agent
from agents.equity_reasearch_agent import equity_research_agent
from agents.risk_agent import risk_agent
from agents.client import client
#client = Mistral(api_key=os.environ["MISTRAL_API_KEY"])


app = FastAPI(title="MarketPulse Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)


class RegisterRequest(BaseModel):
    email: str
    password: str

class LoginRequest(BaseModel):
    email: str
    password: str


@app.post("/auth/register")
async def register(body: RegisterRequest):
    if len(body.password.encode('utf-8')) > 72:
        raise HTTPException(status_code=400, detail="Password must be 72 characters or less")
    
    hashed = hash_password(body.password)
    try:
        result = await asyncio.to_thread(
            query,
            "INSERT INTO users (email, password_hash) VALUES (%s, %s) RETURNING id, email",
            [body.email, hashed]
        )
        user = result.rows[0]
        token = create_token(user["id"], user["email"])
        return {"token": token, "email": user["email"]}
    except Exception as e:
        raise HTTPException(status_code=400, detail="Email already exists")

@app.post("/auth/login")
async def login(body: LoginRequest):
    result = await asyncio.to_thread(
        query,
        "SELECT * FROM users WHERE email = %s",
        [body.email]
    )
    if not result.rows:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    user = result.rows[0]
    if not verify_password(body.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token = create_token(user["id"], user["email"])
    return {"token": token, "email": user["email"]}

@app.get("/auth/me")
async def me(user=Depends(get_current_user)):
    return user


async def synthesizer(ticker: str, news: dict, sentiment: dict, fundamentals: dict, technical: dict, equity: dict, risk: dict) -> dict:
    response = await asyncio.to_thread(
        client.chat.complete,
        model="mistral-small-latest",
        messages=[
            {
                "role": "system",
                "content": """You are a senior portfolio manager synthesizing reports from 6 specialist agents.
                Produce a final investment report. Return JSON with exactly these keys:
                {
                    "recommendation": "strong_buy/buy/hold/sell/strong_sell",
                    "conviction": 1-10,
                    "price_target": 0.0,
                    "risk_reward": "favorable/neutral/unfavorable",
                    "investment_horizon": "short_term/medium_term/long_term",
                    "bull_case": ["point1", "point2", "point3"],
                    "bear_case": ["point1", "point2", "point3"],
                    "key_catalysts": ["catalyst1", "catalyst2"],
                    "key_risks": ["risk1", "risk2"],
                    "position_sizing": "large/medium/small/avoid",
                    "summary": "5 sentence investment summary"
                }
                Return only raw JSON, no markdown."""
            },
            {
                "role": "user",
                "content": f"""Synthesize this analysis for {ticker}:
                NEWS: {json.dumps(news)}
                SENTIMENT: {json.dumps(sentiment)}
                FUNDAMENTALS: {json.dumps(fundamentals)}
                TECHNICAL: {json.dumps(technical)}
                EQUITY RESEARCH: {json.dumps(equity)}
                RISK: {json.dumps(risk)}"""
            }
        ]
    )
    raw = response.choices[0].message.content.replace("```json", "").replace("```", "").strip()
    return json.loads(raw)

analysis_cache = {}
@app.post("/analyse/{ticker}")
async def analyse(ticker: str):
    from datetime import datetime, timedelta
    
    # return cache if analysed today
    if ticker in analysis_cache:
        cached_time, cached_data = analysis_cache[ticker]
        if datetime.now() - cached_time < timedelta(hours=24):
            return {**cached_data, "cached": True}
    
    news = await news_agent(ticker)
    sentiment, fundamentals, technical, equity, risk = await asyncio.gather(
        sentiment_agent(ticker, news),
        fundamentals_agent(ticker),
        technical_agent(ticker),
        equity_research_agent(ticker),
        risk_agent(ticker),
    )
    report = await synthesizer(ticker, news, sentiment, fundamentals, technical, equity, risk)
    
    result = {
        "ticker": ticker,
        "report": report,
        "agents": {
            "news": news,
            "sentiment": sentiment,
            "fundamentals": fundamentals,
            "technical": technical,
            "equity": equity,
            "risk": risk
        }
    }
    
    analysis_cache[ticker] = (datetime.now(), result)
    return result


@app.get("/test/{ticker}")
async def test(ticker: str):
    return await analyse(ticker)