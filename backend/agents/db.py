import psycopg2
import psycopg2.extras
import os
from dotenv import load_dotenv

load_dotenv()

conn = psycopg2.connect(os.environ["DATABASE_URL"])
conn.autocommit = True

def query(sql: str, params=None):
    with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
        cur.execute(sql, params)
        try:
            rows = cur.fetchall()
            return type('Result', (), {'rows': rows})()
        except:
            return type('Result', (), {'rows': []})()