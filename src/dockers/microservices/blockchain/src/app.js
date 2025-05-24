const express = require('express');
const cors = require('cors');
const axios = require('axios');
const blockchainRoutes = require('./routes/blockchainRoutes');
const { verifyToken } = require('../auth-service/src/auth');

const app = express();
const port = 3000;

app.use(cors({
  origin: 'http://localhost:8080',
  methods: 'GET,POST',
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Middleware de autenticación
app.use((req, res, next) => {
  if (req.path === '/blockchain/health') return next();
  verifyToken(req, res, next);
});

app.use('/blockchain', blockchainRoutes);

app.get('/blockchain/health', (req, res) => {
  res.json({ status: 'OK' });
});

app.listen(port, () => {
  console.log(`Blockchain service running on port ${port}`);
});