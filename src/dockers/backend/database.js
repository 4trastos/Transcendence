import sqlite3 from 'sqlite3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const sqlite = sqlite3.verbose();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export let db; 

export function setDbInstance(dbInstance) {
    db = dbInstance;
    console.log('Instancia de DB de Fastify decorada para database.js.');
}

export const executeWithRetry = async (fn, maxRetries = 5, delay = 200) => {
    let lastError;
    for (let i = 0; i < maxRetries; i++) {
        try {
            // Asegurarse de que la instancia de DB está disponible antes de ejecutar la función.
            if (!db) {
                throw new Error("Instancia de base de datos no disponible.");
            }
            return await fn();
        } catch (error) {
            lastError = error;
            if (error.code === 'SQLITE_BUSY') {
                console.warn(`SQLITE_BUSY: Reintentando conexión/consulta... (${i + 1}/${maxRetries})`);
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
        // Asegúrate de usar la instancia global 'db'
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
    let retries = 0;
    const MAX_RETRIES = 3;
    
    while (retries < MAX_RETRIES) {
        try {
            await run('BEGIN TRANSACTION');
            const result = await operations();
            await run('COMMIT');
            return result;
        } catch (error) {
            await run('ROLLBACK');
            
            if (error.code === 'SQLITE_BUSY' && retries < MAX_RETRIES) {
                retries++;
                const delay = 200 * Math.pow(2, retries); // Backoff exponencial
                console.warn(`Reintentando transacción (${retries}/${MAX_RETRIES})...`);
                await new Promise(resolve => setTimeout(resolve, delay));
                continue;
            }
            
            throw error;
        }
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

// Wrapper para run, get, all, exec que usan executeWithRetry
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
