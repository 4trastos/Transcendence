const fastify = require('fastify');
const path = require('path');
const cors = require('@fastify/cors');
const helmet = require('@fastify/helmet');
const crypto = require('crypto');
const rateLimit = require('@fastify/rate-limit');
const fastifySession = require('@fastify/session');
const fastifyCookie = require('@fastify/cookie');
const fs = require('fs');
const { db } = require('./database');
const vault = require("node-vault")({
    apiVersion: "v1",
    endpoint: process.env.VAULT_ADDR || "http://0.0.0.0:8200",
    token: process.env.VAULT_TOKEN || "root",
});
const userRoutes = require('./routes/userRoutes');
const gameRoutes = require('./routes/gameRoutes');

const app = fastify({
    logger: true,
    trustProxy: true,
    ignoreTrailingSlash: true
});

const port = process.env.PORT || 3000;

// Configuración de seguridad mejorada
app.register(rateLimit, {
    global: true,
    max: 100,
    timeWindow: '15 minutes',
    addHeaders: {
        'x-ratelimit-limit': true,
        'x-ratelimit-remaining': true,
        'x-ratelimit-reset': true,
        'retry-after': true
    }
});

// Middlewares
app.register(helmet);
app.register(cors, {
    origin: ['http://localhost:8080', 'https://localhost:8080', 'http://localhost:3001', 'https://localhost:3001', 'http://localhost:3000', 'https://localhost:3000'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    credentials: true,
    optionsSuccessStatus: 200
});

// Configuración de cookies y sesión
app.register(fastifyCookie);
app.register(fastifySession, {
    secret: process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex'),
    cookie: { 
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        maxAge: 24 * 60 * 60 * 1000
    }
});

// Headers de seguridad adicionales
app.addHook('onSend', (request, reply, payload, done) => {
    reply.headers({
        'Access-Control-Allow-Credentials': 'true',
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'X-XSS-Protection': '1; mode=block',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    });
    done();
});

// CSP
app.addHook('onSend', (request, reply, payload, done) => {
    const csp = [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline'",
        "script-src-elem 'self'",
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
        "img-src 'self' data:",
        "connect-src 'self'",
        "font-src 'self' https://fonts.gstatic.com",
        "form-action 'self'"
    ].join('; ');
    
    reply.header('Content-Security-Policy', csp);
    done();
});

// Rutas
app.register(userRoutes, { prefix: '/api' });
app.register(gameRoutes, { prefix: '/api' });

// Health check endpoint
app.get('/health', async (request, reply) => {
    try {
        const dbStatus = db.open ? 'connected' : 'disconnected';
        let vaultStatus = 'disconnected';
        
        try {
            await vault.health();
            vaultStatus = 'connected';
        } catch (vaultError) {
            console.error('Error checking Vault health:', vaultError);
        }

        reply.status(200).send({ 
            status: 'OK', 
            db: dbStatus,
            vault: vaultStatus,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        reply.status(500).send({ 
            status: 'ERROR',
            error: error.message 
        });
    }
});

// Endpoint de secretos de Vault
app.get("/api/secret", async (request, reply) => {
    try {
        const secret = await vault.read("secret/myapp");
        reply.send(secret.data.data);
    } catch (error) {
        console.error("Error al obtener secretos de Vault:", error);
        reply.status(500).send({ 
            error: "Error al obtener secretos",
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Manejador de errores centralizado
app.setErrorHandler((error, request, reply) => {
    console.error('Error global:', {
        error: error.message,
        stack: error.stack,
        url: request.raw.url,
        method: request.raw.method,
        timestamp: new Date().toISOString()
    });

    reply.status(error.statusCode || 500).send({
        error: 'Internal Server Error',
        message: error.message,
        ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
    });
});

// Iniciar servidor
app.listen({ port, host: '0.0.0.0' }, (err) => {
    if (err) {
        app.log.error(err);
        process.exit(1);
    }
    console.log(`Servidor escuchando en http://localhost:${port}`);
    console.log('Configuración:');
    console.log('- Entorno:', process.env.NODE_ENV || 'development');
    console.log('- Vault:', process.env.VAULT_ADDR || 'http://0.0.0.0:8200');
});

// Manejo de cierre limpio
process.on('SIGINT', () => {
    db.close();
    console.log('Conexión a SQLite cerrada');
    app.close(() => {
        process.exit();
    });
});

module.exports = app;