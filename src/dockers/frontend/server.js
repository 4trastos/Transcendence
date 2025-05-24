import Fastify from 'fastify';
import path from 'path';
import { fileURLToPath } from 'url';
import fastifyStatic from '@fastify/static';
import dotenv from 'dotenv';
dotenv.config({ path: '.env' });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const fastify = Fastify({ logger: true });

// Servir archivos estáticos desde la carpeta "public"
fastify.register(fastifyStatic, {
  root: path.join(__dirname, 'public'),
  prefix: '/', // esto sirve los archivos estáticos como /js/bundle.js, /css/estilos.css, etc.
});
fastify.get('/env', async (request, reply) => {
  return { env: process.env.NODE_ENV || 'development' };
});
// Redirigir todas las rutas no encontradas al index.html (SPA)
fastify.setNotFoundHandler((request, reply) => {
  reply.sendFile('index.html');
});

// Iniciar servidor
const start = async () => {
  try {
    await fastify.listen({ port: process.env.FRONT_PORT || 3040, host: '0.0.0.0' });
    fastify.log.info(`Servidor ejecutándose en http://localhost:3040`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
