// utils/apiKeyGenerator.js
const crypto = require('crypto');

function generateAPIKey() {
  return crypto.randomBytes(32).toString('hex'); // Key de 64 caracteres
}

module.exports = { generateAPIKey };