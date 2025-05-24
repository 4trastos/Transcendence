const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const router = express.Router();

const db = new sqlite3.Database('/var/lib/sqlite/sqlite.db');

router.get('/', (req, res) => {
  db.all('SELECT id, username, email FROM users', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

router.get('/:id', (req, res) => {
  db.get(
    'SELECT id, username, email FROM users WHERE id = ?',
    [req.params.id],
    (err, row) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!row) return res.status(404).json({ error: 'Usuario no encontrado' });
      res.json(row);
    }
  );
});

module.exports = router;