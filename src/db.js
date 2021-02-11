import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const {
  DATABASE_URL: connectionString,
  NODE_ENV: nodeEnv = 'development',
} = process.env;

console.log('process.env :>> ', process.env.DATABASE_URL);

if (!connectionString) {
  console.error('Vantar DATABASE_URL');
  process.exit(1);
}

// Notum SSL tengingu við gagnagrunn ef við erum *ekki* í development mode, þ.e.a.s. á local vél
const ssl = nodeEnv !== 'development' ? { rejectUnauthorized: false } : false;

const pool = new pg.Pool({ connectionString, ssl });

// TODO gagnagrunnstengingar
//const pool = new pg.Pool({ connectionString });

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

export async function insert(data) {
  const q = `
    INSERT INTO signatures
    (name, nationalId, comment, anonymous)
    VALUES
    ($1, $2, $3, $4)`;
  const values = [data.name, data.nationalId, data.comment, data.anonymous];

  return query(q, values);
}

export async function select() {
  const result = await query('SELECT * FROM signatures ORDER BY name');

  return result.rows;
}

/**
 * Framkvæmir SQL fyrirspurn á gagnagrunn sem keyrir á `DATABASE_URL`,
 * skilgreint í `.env`
 *
 * @param {string} q Query til að keyra
 * @param {array} values Fylki af gildum fyrir query
 * @returns {object} Hlut með niðurstöðu af því að keyra fyrirspurn
 */
export async function query(q, values = []) {
  const client = await pool.connect();

  try {
    const result = await client.query(q, values);
    return result;
    console.log('rows :>> ', result.rows);
  } catch (e) {
    console.log('Error slecting', e);
  } finally {
    client.release();
  }
}

