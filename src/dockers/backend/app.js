const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const userRoutes = require('./routes/userRoutes');
const session = require("express-session");
const gameRoutes = require('./routes/gameRoutes');
const fs = require('fs');
const path = require('path');
const cors = require('cors');  // <-- Importa cors
const axios = require('axios');  // Añadir axios para hacer solicitudes HTTP
const vault = require("node-vault")({
    apiVersion: "v1",
    endpoint: process.env.VAULT_ADDR || "http://0.0.0.0:8200",
    token: process.env.VAULT_TOKEN || "root",
  });

const app = express();
const port = 3000;

const corsOptions = {
    origin: ['http://localhost:8080', 'https://localhost:8080', 'http://localhost:3001', 'https://localhost:3001'],
    methods: 'GET,POST,PUT,DELETE,OPTIONS',
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
    optionsSuccessStatus: 200
  };

app.use(cors(corsOptions));

app.use(express.json());

app.use(session({
    secret: process.env.SESSION_SECRET || "super_safe_secret",
    resave: false,
    saveUninitialized: false,
    cookie: { 
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        maxAge: 24 * 60 * 60 * 1000 // 1 día
    }
}));

app.use((req, res, next) => {
    res.header('Access-Control-Allow-Credentials', 'true');
    next();
});

app.use('/api', userRoutes);

app.use('/api', gameRoutes);

app.options('*', cors(corsOptions));

app.use(express.static(path.join(__dirname, 'public')));

// Conectar a la base de datos SQLite
const dbPath = path.join(__dirname, 'data', 'sqlite.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error al conectar a la base de datos:', err.message);
    } else {
        console.log('Conectado a la base de datos SQLite');
    }
});

// Ejecutar el script de inicialización de la base de datos desde tools/init.sql
const initSQL = fs.readFileSync(path.join(__dirname, 'tools', 'init.sql'), 'utf-8');
db.exec(initSQL, (err) => {
    if (err) {
        console.error('Error al inicializar la base de datos:', err.message);
    } else {
        console.log('Base de datos inicializada correctamente');
    }
});

// Ruta de prueba
app.get('/api/test', (req, res) => {
    res.json({ message: '¡Conexión con el backend exitosa!' });
});

// Ruta básica para probar el servidor
app.get('/prueba', (req, res) => {
    res.send('¡Hola, mundo desde Node.js!');
});

// Ruta para guardar resultados del juego
app.post('/api/gameResult', (req, res) => {
    const { player1_id, player2_id, score_player1, score_player2, winner_id } = req.body;
    
    const sql = `INSERT INTO games 
        (player1_id, player2_id, score_player1, score_player2, winner_id, played_at) 
        VALUES (?, ?, ?, ?, ?, datetime('now'))`;
    
    db.run(sql, [player1_id, player2_id, score_player1, score_player2, winner_id], function(err) {
        if (err) {
            console.error('Error al guardar resultado:', err.message);
            return res.status(500).json({ error: 'Error al guardar resultado' });
        }
        res.json({ 
            message: 'Resultado guardado', 
            gameId: this.lastID 
        });
    });
});

// Ruta para obtener historial de juegos
app.get('/api/gameHistory', (req, res) => {
    const userId = req.query.user_id;
    
    if (!userId) {
        return res.status(400).json({ error: 'Se requiere user_id' });
    }
    
    const sql = `SELECT * FROM games 
                WHERE player1_id = ? OR player2_id = ?
                ORDER BY played_at DESC
                LIMIT 10`;
    
    db.all(sql, [userId, userId], (err, rows) => {
        if (err) {
            console.error('Error al consultar historial:', err.message);
            return res.status(500).json({ error: 'Error al consultar historial' });
        }
        res.json(rows);
    });
});

// Ruta para obtener todos los juegos
app.get('/api/games', (req, res) => {
    db.all('SELECT * FROM games', [], (err, rows) => {
        if (err) {
            console.error('Error al consultar la tabla games:', err.message);
            res.status(500).send('Error al consultar la tabla games');
            return;
        }
        // Devuelve los juegos en formato JSON
        res.json(rows);
    });
});

// Ruta para obtener todos los elementos (items)
app.get('/api/items', (req, res) => {
    db.all('SELECT * FROM items', [], (err, rows) => {
        if (err) {
            console.error('Error al consultar los elementos:', err.message);
            res.status(500).send('Error al consultar los elementos');
            return;
        }
        res.json(rows);
    });
});

// Endpoint para obtener secrets
app.get("/api/secret", async (req, res) => {
    try {
      const secret = await vault.read("secret/myapp");
      console.error("Secreto leído de Vault:", secret); 
      res.json(secret.data.data);
    } catch (error) {
      console.error("Error al obtener secretos de Vault:", error);
      res.status(500).json({ error: "Error al obtener secretos  ################" });
    }
  });


// Endpoint para crear un nuevo ítem
app.post('/api/items', (req, res) => {
    const { name, description } = req.body;

    if (!name || !description) {
        return res.status(400).json({ error: 'Name and description are required' });
    }

    const sql = 'INSERT INTO items (name, description) VALUES (?, ?)';
    const params = [name, description];

    db.run(sql, params, function(err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json({ id: this.lastID, name, description }); // Devuelve el nuevo ítem con el ID generado
    });
});

// Ruta para probar la conexión a la base de datos con una consulta de prueba
app.get('/api/test_db', (req, res) => {
    db.get('SELECT 1', [], (err, row) => {
        if (err) {
            console.error('Error al hacer la consulta de prueba:', err.message);
            res.status(500).send('Error al hacer la consulta de prueba');
            return;
        }
        // Respuesta de éxito si la consulta de prueba fue correcta
        res.send('Conexión a la base de datos exitosa');
    });
});

// Nueva ruta para obtener el estado de Avalanche
//app.get('/api/avalanche_status', async (req, res) => {
//    try {
//       const response = await axios.get('http://blockchain:9650/ext/health');
//       res.json(response.data);
//    } catch (error) {
//        console.error('Error al obtener el estado de Avalanche:', error.message);
//        res.status(500).send('Error al obtener el estado de Avalanche');
//    }
//});

// Iniciar el servidor
app.listen(port, () => {
    console.log(`Servidor escuchando en http://localhost:${port}`);
});