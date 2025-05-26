// middleware/authAPIKey.js
const pool = require('../db/connection'); // Conexión a PostgreSQL

async function authenticateAPIKey(req, res, next) {
  const apiKey = req.headers['x-api-key'] || req.query.api_key;

  if (!apiKey) {
    return res.status(401).json({ error: 'API Key requerida' });
  }

  try {
    const result = await pool.query(
      'SELECT * FROM api_keys WHERE key = $1 AND active = true',
      [apiKey]
    );

    if (result.rows.length === 0) {
      return res.status(403).json({ error: 'API Key inválida' });
    }

    req.clientId = result.rows[0].client_id; // Opcional: identificar cliente
    next();
  } catch (error) {
    res.status(500).json({ error: 'Error de autenticación' });
  }
}

module.exports = authenticateAPIKey;