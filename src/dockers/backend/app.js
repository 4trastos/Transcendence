const express = require('express');
const path = require('path');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const crypto = require('crypto'); // Añade esta línea
const rateLimit = require('express-rate-limit');
const session = require("express-session");
const fs = require('fs');
const { db } = require('./database');
const vault = require("node-vault")({
    apiVersion: "v1",
    endpoint: process.env.VAULT_ADDR || "http://0.0.0.0:8200",
    token: process.env.VAULT_TOKEN || "root",
});
const userRoutes = require('./routes/userRoutes');
const gameRoutes = require('./routes/gameRoutes');

const app = express();
const port = process.env.PORT || 3000;

// Configuración de seguridad mejorada
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 100, // límite de 100 peticiones por IP
    standardHeaders: true,
    legacyHeaders: false
});

// Middlewares
app.use(morgan('dev'));
app.use(helmet());
app.use(limiter);
app.use(cors({
    origin: ['http://localhost:8080', 'https://localhost:8080', 'http://localhost:3001', 'https://localhost:3001', 'http://localhost:3000', 'https://localhost:3000'],
    methods: 'GET,POST,PUT,DELETE,OPTIONS',
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    credentials: true,
    optionsSuccessStatus: 200
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configuración de sesión
app.use(session({
    secret: process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex'),
    resave: false,
    saveUninitialized: false,
    cookie: { 
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        maxAge: 24 * 60 * 60 * 1000
    }
}));

// Headers de seguridad adicionales
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('X-Content-Type-Options', 'nosniff');
    res.header('X-Frame-Options', 'DENY');
    res.header('X-XSS-Protection', '1; mode=block');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    next();
});

// CSP
app.use((req, res, next) => {
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
    res.setHeader('Content-Security-Policy', csp);
    next();
});

// Rutas
app.use('/api', userRoutes);
app.use('/api', gameRoutes);

// Health check endpoint
app.get('/health', async (req, res) => {
    try {
        const dbStatus = db.open ? 'connected' : 'disconnected';
        let vaultStatus = 'disconnected';
        
        try {
            await vault.health();
            vaultStatus = 'connected';
        } catch (vaultError) {
            console.error('Error checking Vault health:', vaultError);
        }

        res.status(200).json({ 
            status: 'OK', 
            db: dbStatus,
            vault: vaultStatus,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({ 
            status: 'ERROR',
            error: error.message 
        });
    }
});

// Endpoint de secretos de Vault
app.get("/api/secret", async (req, res) => {
    try {
        const secret = await vault.read("secret/myapp");
        res.json(secret.data.data);
    } catch (error) {
        console.error("Error al obtener secretos de Vault:", error);
        res.status(500).json({ 
            error: "Error al obtener secretos",
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Manejador de errores centralizado
app.use((err, req, res, next) => {
    console.error('Error global:', {
        error: err.message,
        stack: err.stack,
        url: req.originalUrl,
        method: req.method,
        timestamp: new Date().toISOString()
    });

    res.status(err.status || 500).json({
        error: 'Internal Server Error',
        message: err.message,
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
});

// Iniciar servidor
app.listen(port, () => {
    console.log(`Servidor escuchando en http://localhost:${port}`);
    console.log('Configuración:');
    console.log('- Entorno:', process.env.NODE_ENV || 'development');
    console.log('- Vault:', process.env.VAULT_ADDR || 'http://0.0.0.0:8200');
});

// Manejo de cierre limpio
process.on('SIGINT', () => {
    db.close();
    console.log('Conexión a SQLite cerrada');
    process.exit();
});

module.exports = app;