const express = require('express');
const axios = require('axios');
const router = express.Router();

const AVALANCHE_URL = 'http://blockchain:9650';

router.get('/health', async (req, res) => {
  try {
    const response = await axios.get(`${AVALANCHE_URL}/ext/health`);
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: 'Error al conectar con Avalanche' });
  }
});

router.get('/address/:id', async (req, res) => {
  try {
    // Lógica para obtener dirección del usuario
    res.json({ address: `0x${req.params.id}1234567890abcdef` });
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener dirección' });
  }
});

module.exports = router;