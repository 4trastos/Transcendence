const express = require('express');
const bcrypt = require('bcrypt');
const { generateToken } = require('../auth');
const router = express.Router();

// Mock database
const users = [];

router.post('/register', async (req, res) => {
  const { username, email, password } = req.body;
  
  if (!username || !email || !password) {
    return res.status(400).json({ error: 'Faltan campos requeridos' });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = { 
      id: users.length + 1, 
      username, 
      email, 
      password: hashedPassword 
    };
    users.push(user);
    
    const token = generateToken(user);
    res.status(201).json({ token, userId: user.id });
  } catch (error) {
    res.status(500).json({ error: 'Error al registrar usuario' });
  }
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  
  const user = users.find(u => u.email === email);
  if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

  const validPassword = await bcrypt.compare(password, user.password);
  if (!validPassword) return res.status(401).json({ error: 'Credenciales inválidas' });

  const token = generateToken(user);
  res.json({ token, userId: user.id });
});

module.exports = router;