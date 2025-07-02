import Fastify, { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import cors from '@fastify/cors';
import fastifySwagger from "@fastify/swagger";
import swaggerUI from "@fastify/swagger-ui";
import dotenv from 'dotenv';
import fastifyJwt, { FastifyJWTOptions } from '@fastify/jwt'
import { HandleException } from "./domain/exception/HandleException";
import {fastifyCookie} from "@fastify/cookie";

/**
 * Configures the Fastify application with Swagger and CORS.
 * @returns {Promise<FastifyInstance>} The Fastify server instance.
 * @author Adrian Herrera
 * @description This function sets up the Fastify server with Swagger documentation and CORS support.
 */
export default async function configApp() {
	dotenv.config();
	const fastify: FastifyInstance = Fastify({ logger: true ,}); 
	fastify.register(fastifyCookie);

	fastify.register(fastifySwagger, {
		openapi: {
			openapi: '3.0.0',
			info: {
			  title: 'Test swagger',
			  description: 'Testing the Fastify swagger API',
			  version: '0.1.0'
			},
			servers: [
			  {
				url: 'http://localhost:3060',
				description: 'Development server'
			  }
			],
			tags: [
			  { name: 'chat', description: 'Chat related end-points' },
			  { name: 'chat-ws', description: 'Chat Websocket related end-points' }
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

	fastify.register(require("@fastify/jwt"), {
		secret: process.env.JWT_SECRET,
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
	fastify.register(swaggerUI, {
		routePrefix: '/docs',
	});

	fastify.register(cors, {
		origin: ['http://localhost:8080', 'https://localhost:8080', 'http://localhost:3001', 'https://localhost:3001','http://localhost:3040', 'http://localhost:3000','https://localhost:8443', 'https://localhost:3000'],
		methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
		allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
		credentials: true,
		optionsSuccessStatus: 200
	});

	fastify.setErrorHandler((error, request: FastifyRequest, reply: FastifyReply) => {
		try {
			console.error(error);
			const isHandleException = error as unknown as HandleException;
			reply.status(isHandleException.code).send({
				error: isHandleException.name,
				message: isHandleException.message,
			});
		}
		catch (err) {
			reply.status(500).send({
				error: 'Internal Server Error',
				message: error.message,
			});
		}
	});
	return fastify;
}
