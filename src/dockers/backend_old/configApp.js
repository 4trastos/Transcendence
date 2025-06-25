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
import vaultLib from 'node-vault';
import fastifyBcrypt from 'fastify-bcrypt';
import { db } from './database.js';
import {userRoutes} from './routes/userRoutes.js';
import {gameRoutes} from './routes/gameRoutes.js';
import {authRoutes} from './routes/authRoutes.js';
import {profileRoutes} from './routes/profileRoutes.js';
import {SQLiteConnection}  from './db/SQLiteConnection.js';
import multipart from '@fastify/multipart';
import jwt from '@fastify/jwt';
import fastifyStatic from '@fastify/static';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';
import sqlitePlugin from './plugins/sqlite.js'
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);


export default async function configApp() {
	dotenv.config();

	const dbConnect = new SQLiteConnection("sqlite.db","init.sql");
	dbConnect.executeScript();


	const app = fastify({
		logger: true,
		trustProxy: true,
		ignoreTrailingSlash: true
	});
	app.register(sqlitePlugin, {
		dbFile: 'sqlite.db',
		initScript: 'init.sql'
	});
	app.register(fastifyStatic, {
	root: path.join(__dirname, 'uploads'),
	prefix: '/uploads/',
	setHeaders: (res, path, stat) => {
		res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
		res.setHeader('Access-Control-Allow-Origin', 'http://localhost:4200');
	},
	}); 

	app.register(multipart);

	app.register(fastifyBcrypt, {
		saltWorkFactor: process.env.SALT_ROUNDS ? parseInt(process.env.SALT_ROUNDS) : 12,
	});


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
				{ name: 'game', description: 'Historial, puntaje y datos del juego' }
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


	const collectDefaultMetrics = Prometheus.collectDefaultMetrics;

	collectDefaultMetrics({ timeout: 5000 });

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
			cookie: {
			signed: false,
			cookieName: 'token',
		},
	});


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
		origin: ['http://localhost:8080', 'https://localhost:8080', 'https://localhost:3040','http://localhost:3040', 'http://localhost:3000', 'https://localhost:3000'],
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
			"default-src 'self'",
			"script-src 'self' 'unsafe-inline'",
			"script-src-elem 'self'",
			"style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
			"img-src 'self' data:",
			"connect-src 'self'",
			"font-src 'self' https://fonts.gstatic.com",
			"form-action 'self'"
		].join('; '));
		done();
	});


	return app;
}