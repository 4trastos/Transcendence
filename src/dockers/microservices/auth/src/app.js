const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');
const { verifyToken } = require('./auth');

const app = express();
const port = 3000;

app.use(cors({
  origin: 'http://localhost:8080',
  methods: 'GET,POST',
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

app.use('/auth', authRoutes);

app.get('/auth/validate', verifyToken, (req, res) => {
  res.json({ valid: true, user: req.user });
});

app.listen(port, () => {
  console.log(`Auth service running on port ${port}`);
});