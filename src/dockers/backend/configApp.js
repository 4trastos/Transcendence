import fastify from 'fastify';
import fastifySwagger from '@fastify/swagger';
import swaggerUI from '@fastify/swagger-ui';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import crypto from 'crypto';
import Prometheus from 'prom-client';
import rateLimit from '@fastify/rate-limit';
import fastifySession from '@fastify/session';
import fastifyCookie from '@fastify/cookie';
import dotenv from 'dotenv';
import fastifyBcrypt from 'fastify-bcrypt';

// Asegúrate de que todas las rutas exportan la función con el nombre correcto
import { userRoutes } from './routes/userRoutes.js';
import { gameRoutes } from './routes/gameRoutes.js';
import { authRoutes } from './routes/authRoutes.js';
import { profileRoutes } from './routes/profileRoutes.js';
import { statsRoutes } from './routes/statsRoutes.js'; 

// Importa el plugin personalizado de SQLite
import sqlitePlugin from './plugins/sqlite.js';

// No es necesario SQLiteConnection aquí, el plugin lo manejará.
// import { SQLiteConnection }  from './db/SQLiteConnection.js'; 

import multipart from '@fastify/multipart';
import jwt from '@fastify/jwt';
import fastifyStatic from '@fastify/static';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default async function configApp() {
    dotenv.config();

    // La instancia de SQLiteConnection ya no se inicializa aquí directamente
    // const dbConnect = new SQLiteConnection("sqlite.db", "init.sql"); 

    const app = fastify({
        logger: true,
        trustProxy: true,
        ignoreTrailingSlash: true
    });

    // Registra tu plugin de SQLite.
    // Este plugin debería manejar la conexión y decorar 'app' con la instancia de la base de datos.
    app.register(sqlitePlugin, {
        dbFile: 'sqlite.db',
        initScript: 'init.sql' 
    });

    // Configuración para servir archivos estáticos (por ejemplo, avatares subidos)
    app.register(fastifyStatic, {
        root: path.join(__dirname, 'uploads'),
        prefix: '/uploads/',
        setHeaders: (res, path, stat) => {
            res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
            res.setHeader('Access-Control-Allow-Origin', 'http://localhost:4200'); // Revisa si este origen es correcto.
        },
    }); 

    app.register(multipart);

    app.register(fastifyBcrypt, {
        saltWorkFactor: process.env.SALT_ROUNDS ? parseInt(process.env.SALT_ROUNDS) : 12,
    });

    // Configuración de Swagger/OpenAPI
    app.register(fastifySwagger, {
        openapi: {
            openapi: '3.0.0',
            info: {
                title: 'Test swagger',
                description: 'Testing the Fastify swagger API',
                version: '0.1.0'
            },
            servers: [
                {
                    url: 'http://localhost:3000',
                    description: 'Development server'
                }
            ],
            tags: [
                { name: 'Users', description: 'Gestion de usuarios' },
                { name: 'Auth', description: 'Autorizaciones' },
                { name: 'game', description: 'Historial, puntaje y datos del juego' },
                { name: 'Profile', description: 'Gestión de perfiles de usuario' },
                { name: 'Stats', description: 'Estadísticas de juego' }
            ],
            components: {
                securitySchemes: {
                    bearerAuth: {
                        type: "http",
                        scheme:'bearer',
                        bearerFormat: "JWT",
                    },
                }
            },
            security: [
                {
                    bearerAuth: [],
                },
            ],
            externalDocs: {
                url: 'https://swagger.io',
                description: 'Find more info here'
            }
        }
    });

    app.register(swaggerUI, {
        routePrefix: '/docs',
    });


    // Métricas de Prometheus
    const collectDefaultMetrics = Prometheus.collectDefaultMetrics;
    collectDefaultMetrics({ timeout: 5000 });

    // Plugin JWT
    app.register(jwt, {
        secret: process.env.JWT_SECRET || crypto.randomBytes(64).toString('hex'),
        algorithm: 'HS256',
        issuer: 'pong-app.com',
        audience: 'pong-client',
        accessExpiry: '15m',
        refreshExpiry: '7d',
        clockTolerance: 30,
        minPasswordStrength: 3,
        maxDevicesPerUser: 5,
        tempTokenExpiry: '15m',
        tempTokenPurpose: '2fa_verification',
    });


    // Configuración de seguridad mejorada: Rate Limiting
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

    // Middlewares de seguridad: Helmet
    app.register(helmet);

    // Configuración CORS
    app.register(cors, {
        origin: [
            'http://localhost:8080',
            'https://localhost:8080',
            'https://localhost:3040',
            'http://localhost:3040',
            'http://localhost:3000', 
            'https://localhost:3000',
            'https://localhost:8443',
            'http://localhost:8443',
            'http://localhost:4200',
            // Agrega cualquier otro origen que tu frontend pueda usar
        ],
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
            secure: process.env.NODE_ENV === 'production', // Solo true en producción con HTTPS
            httpOnly: true,
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax', // 'none' para CORS con secure:true
            maxAge: 24 * 60 * 60 * 1000 // 24 horas
        }
    });

    // Hooks para añadir encabezados de seguridad adicionales y CSP
    app.addHook('onSend', (request, reply, payload, done) => {
        reply
        .headers({
            'Access-Control-Allow-Credentials': 'true',
            'X-Content-Type-Options': 'nosniff',
            'X-Frame-Options': 'DENY',
            'X-XSS-Protection': '1; mode=block',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        })
        .header('Content-Security-Policy', [
            "default-src 'self' https://fonts.googleapis.com https://fonts.gstatic.com",
            "script-src 'self' 'unsafe-inline'", // 'unsafe-inline' puede ser necesario para scripts en línea
            "script-src-elem 'self'",
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com", // 'unsafe-inline' puede ser necesario para estilos en línea
            "img-src 'self' data:",
            // Asegúrate de que todos los dominios desde los que se carga contenido (APIs, Vault) estén aquí
            "connect-src 'self' http://localhost:3000 https://localhost:8443 https://security:8200", 
            "font-src 'self' https://fonts.gstatic.com",
            "form-action 'self'"
        ].join('; '));
        done();
    });

    // Registro de rutas de la API (solo una vez, por medio de plugins)
    app.register(userRoutes, { prefix: '/api' });
    app.register(gameRoutes, { prefix: '/api' });
    app.register(authRoutes, { prefix: '/api' });
    app.register(profileRoutes, { prefix: '/api' });
    app.register(statsRoutes, { prefix: '/api' });

    return app;
}
