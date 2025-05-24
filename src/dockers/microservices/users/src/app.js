const express = require('express');
const cors = require('cors');
const userRoutes = require('./routes/userRoutes');
const { verifyToken } = require('../auth-service/src/auth'); // Reutilizamos el auth

const app = express();
const port = 3000;

app.use(cors({
  origin: 'http://localhost:8080',
  methods: 'GET,POST,PUT,DELETE',
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Middleware para verificar token JWT
app.use((req, res, next) => {
  if (req.path === '/users/health') return next();
  verifyToken(req, res, next);
});

app.use('/users', userRoutes);

app.get('/users/health', (req, res) => {
  res.json({ status: 'OK' });
});

app.listen(port, () => {
  console.log(`User service running on port ${port}`);
});