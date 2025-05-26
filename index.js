const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'mi_api',
  password: '123456789',
  port: 5432,
});

app.get('/buscar/:documento', async (req, res) => {
  const documento = req.params.documento;
  try {
    const result = await pool.query(
      'SELECT item, nombre_completo FROM personas WHERE documento = $1',
      [documento]
    );
    if (result.rows.length > 0) {
      const row = result.rows[0];
      res.json({ item: row.item, nombre_completo: row.nombre_completo });
    } else {
      res.status(404).json({ error: 'No encontrado' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

app.listen(port, () => {
  console.log(`API escuchando en http://localhost:${port}`);
});
