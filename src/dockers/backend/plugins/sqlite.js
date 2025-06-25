// plugins/sqlite.js
import fp from 'fastify-plugin';
import { SQLiteConnection } from '../db/SQLiteConnection.js'; // Asegúrate de que la ruta es correcta

async function sqlitePlugin(fastify, options) {

  const dbConnect = new SQLiteConnection(options.dbFile, options.initScript);
  const dbInstance = dbConnect.getDBInstance();

  // Decora la instancia de Fastify con la instancia de la DB para que esté disponible en rutas, hooks, etc.
  fastify.decorate('db', dbInstance);

  // Opcional: registrar un hook para cerrar la conexión a la base de datos cuando Fastify se cierre.
  fastify.addHook('onClose', (fastifyInstance, done) => {
    if (dbConnect && typeof dbConnect.close === 'function') {
      dbConnect.close();
      fastify.log.info("Conexión a SQLite cerrada por el plugin.");
    }
    done();
  });
}

export default fp(sqlitePlugin);
