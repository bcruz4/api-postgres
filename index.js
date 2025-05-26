require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

// Middlewares y utilidades
const authAPIKey = require('./middleware/authAPIKey');
const { generateAPIKey } = require('./utils/apiKeyGenerator');

const app = express();
const port = process.env.PORT || 3000;

// Configuración de middleware
app.use(cors());
app.use(express.json());

// Conexión a PostgreSQL (configurada en db/connection.js)
const pool = require('./db/connection');

// Ruta protegida para consultas
app.get('/buscar/:documento', authAPIKey, async (req, res) => {
  const documento = req.params.documento;
  
  try {
    const result = await pool.query(
      'SELECT item, nombre_completo FROM personas WHERE documento = $1',
      [documento]
    );

    if (result.rows.length > 0) {
      const row = result.rows[0];
      res.json({ 
        success: true,
        item: row.item, 
        nombre_completo: row.nombre_completo 
      });
    } else {
      res.status(404).json({ 
        success: false,
        error: 'Documento no encontrado' 
      });
    }
  } catch (error) {
    console.error('Error en consulta:', error);
    res.status(500).json({ 
      success: false,
      error: 'Error del servidor' 
    });
  }
});

// Ruta administrativa para generar nuevas API Keys
app.post('/admin/generate-key', (req, res) => {
  // Autenticación con clave maestra
  if (req.headers['x-master-key'] !== process.env.API_MASTER_KEY) {
    return res.status(403).json({ 
      success: false,
      error: 'Acceso no autorizado' 
    });
  }

  const { client_name } = req.body;
  if (!client_name) {
    return res.status(400).json({
      success: false,
      error: 'Se requiere client_name'
    });
  }

  const newKey = generateAPIKey();
  
  // Registrar key en la base de datos
  pool.query(
    'INSERT INTO api_keys (key, client_name) VALUES ($1, $2) RETURNING *',
    [newKey, client_name],
    (err, result) => {
      if (err) {
        console.error('Error al guardar API Key:', err);
        return res.status(500).json({
          success: false,
          error: 'Error al registrar key'
        });
      }
      
      res.json({
        success: true,
        apiKey: result.rows[0].key,
        client: result.rows[0].client_name,
        createdAt: result.rows[0].created_at
      });
    }
  );
});

// Ruta de verificación de salud del servicio
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    service: 'API Consulta Ítems',
    version: '1.0.0'
  });
});

// Manejo de errores para rutas no existentes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Ruta no encontrada'
  });
});

// Iniciar servidor
app.listen(port, () => {
  console.log(`\nAPI escuchando en http://localhost:${port}`);
  console.log(`\nRutas disponibles:`);
  console.log(`- GET  /buscar/:documento`);
  console.log(`- POST /admin/generate-key`);
  console.log(`- GET  /health\n`);
});