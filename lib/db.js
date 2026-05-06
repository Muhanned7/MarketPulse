import pg from 'pg'

const { Pool } = pg

/*
const pool = new Pool({
    connectingString: process.env.DATABASE_URL
})
*/
const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'MarketPulse',
    password: String(process.env.DB_PASSWORD), // Force string conversion
    port: 5432,
  });

export default pool