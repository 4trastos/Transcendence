const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

// Configuración de la base de datos
const dbPath = path.join(__dirname, 'data', 'sqlite.db');

// Crear directorio si no existe
if (!fs.existsSync(path.dirname(dbPath))) {
    fs.mkdirSync(path.dirname(dbPath), { recursive: true });
}

// Configurar conexión con manejo de bloqueos
const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE | sqlite3.OPEN_FULLMUTEX, 
    (err) => {
        if (err) {
            console.error('Error al conectar a la base de datos:', err.message);
        } else {
            console.log('Conectado a SQLite con modo FULLMUTEX');
            db.exec('PRAGMA journal_mode = WAL;');
            db.exec('PRAGMA busy_timeout = 5000;');
            db.exec('PRAGMA synchronous = NORMAL;');
            db.exec('PRAGMA foreign_keys = ON;');
        }
    }
);

// Funciones mejoradas con manejo de reintentos
const executeWithRetry = async (fn, maxRetries = 3, delay = 100) => {
    let lastError;
    for (let i = 0; i < maxRetries; i++) {
        try {
            return await fn();
        } catch (error) {
            lastError = error;
            if (error.code === 'SQLITE_BUSY') {
                await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
                continue;
            }
            throw error;
        }
    }
    throw lastError;
};

// Interface de base de datos
module.exports = {
    db,
    run: (query, params) => executeWithRetry(() => new Promise((resolve, reject) => {
        db.run(query, params, function(err) {
            if (err) reject(err);
            else resolve(this);
        });
    })),
    get: (query, params) => executeWithRetry(() => new Promise((resolve, reject) => {
        db.get(query, params, (err, row) => {
            if (err) reject(err);
            else resolve(row);
        });
    })),
    all: (query, params) => executeWithRetry(() => new Promise((resolve, reject) => {
        db.all(query, params, (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
        });
    })),
    exec: (sql) => executeWithRetry(() => new Promise((resolve, reject) => {
        db.exec(sql, (err) => {
            if (err) reject(err);
            else resolve();
        });
    })),
    // Añadir estas funciones al módulo database.js
    beginTransaction: () => new Promise((resolve, reject) => {
        db.run('BEGIN TRANSACTION', (err) => {
            if (err) reject(err);
            else resolve(true);
        });
    }),

    commit: (transaction) => new Promise((resolve, reject) => {
        db.run('COMMIT', (err) => {
            if (err) reject(err);
            else resolve(true);
        });
    }),

    rollback: (transaction) => new Promise((resolve, reject) => {
        db.run('ROLLBACK', (err) => {
            if (err) reject(err);
            else resolve(true);
        });
    }),
};