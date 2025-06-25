// plugins/sqlite.js
import fp from 'fastify-plugin';
import {SQLiteConnection}  from '../db/SQLiteConnection.js';

async function sqlitePlugin(fastify, options) {
  const dbConnect = new SQLiteConnection(options.dbFile, options.initScript);
  dbConnect.executeScript();
  const dbInstance = dbConnect.getDBInstance();

  // Decoramos fastify con la instancia de la DB para usar en rutas, hooks, etc
  fastify.decorate('db', dbInstance);

  // Opcional: cerrar conexión en el cierre del servidor (si tu clase tiene método close)
  fastify.addHook('onClose', (fastifyInstance, done) => {
    if (dbConnect.close) {
      dbConnect.close();
    }
    done();
  });
}

export default fp(sqlitePlugin);
