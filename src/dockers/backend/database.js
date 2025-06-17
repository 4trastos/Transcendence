import sqlite3 from 'sqlite3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const sqlite = sqlite3.verbose();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, 'data', 'sqlite.db');

if (!fs.existsSync(path.dirname(dbPath))) {
    fs.mkdirSync(path.dirname(dbPath), { recursive: true });
}

export const db = new sqlite.Database('/var/lib/sqlite/sqlite.db', sqlite.OPEN_READWRITE | sqlite.OPEN_CREATE | sqlite.OPEN_FULLMUTEX, (err) => {
    if (err) {
        console.error('Error al abrir la base de datos:', err.message);
    } else {
        console.log('Conectado a SQLite con modo FULLMUTEX');
        // Configuración optimizada
        db.exec('PRAGMA journal_mode = WAL;');
        db.exec('PRAGMA busy_timeout = 10000;'); // 10 segundos de timeout
        db.exec('PRAGMA synchronous = NORMAL;');
        db.exec('PRAGMA wal_autocheckpoint = 100;');
      }
    }
);

export const executeWithRetry = async (fn, maxRetries = 5, delay = 200) => {
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

export const runQuery = (query, params) => {
    return new Promise((resolve, reject) => {
        db.run(query, params, function (err) {
            if (err) {
                console.error('Error en runQuery:', err);
                reject(err);
            } else {
                resolve(this);
            }
        });
    });
};

// Implementación corregida de withTransaction
export async function withTransaction(operations) {
    await this.beginTransaction();
    try {
        const result = await operations();
        await this.commit();
        return result;
    } catch (error) {
        try {
            await this.rollback();
        } catch (rollbackError) {
            console.error('Rollback failed:', rollbackError);
        }
        throw error;
    }
}

// Funciones para manejo de transacciones
export const beginTransaction = () => new Promise((resolve, reject) => {
    db.run('BEGIN TRANSACTION', (err) => {
        if (err) reject(err);
        else resolve(true);
    });
});

export const commit = () => new Promise((resolve, reject) => {
    db.run('COMMIT', (err) => {
        if (err) reject(err);
        else resolve(true);
    });
});

export const rollback = () => new Promise((resolve, reject) => {
    db.run('ROLLBACK', (err) => {
        if (err) reject(err);
        else resolve(true);
    });
});


export const run = (query, params) => executeWithRetry(() => runQuery(query, params));

export const get = (query, params) => executeWithRetry(() => new Promise((resolve, reject) => {
    db.get(query, params, (err, row) => {
        if (err) reject(err);
        else resolve(row);
    });
}));

export const all = (query, params) => executeWithRetry(() => new Promise((resolve, reject) => {
    db.all(query, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
    });
}));

export const exec = (sql) => executeWithRetry(() => new Promise((resolve, reject) => {
    db.exec(sql, (err) => {
        if (err) reject(err);
        else resolve();
    });
}));
