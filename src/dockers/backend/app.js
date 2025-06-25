import Prometheus from 'prom-client';
import vaultLib from 'node-vault';
// Las importaciones de rutas de aquí no necesitan ser utilizadas directamente para app.register en este archivo,
// ya que configApp.js las registra. Se mantienen por si acaso, pero no se usan directamente en app.register aquí.
import { userRoutes } from './routes/userRoutes.js';
import { gameRoutes } from './routes/gameRoutes.js';
import { authRoutes } from './routes/authRoutes.js';
import { profileRoutes } from './routes/profileRoutes.js';
import configApp from './configApp.js';
import dotenv from 'dotenv';
import { statsRoutes } from './routes/statsRoutes.js';
import fs from 'fs';
import { setDbInstance } from './database.js';

dotenv.config();

async function main() {
    // --- Carga del certificado CA de Vault ---
    const VAULT_CA_PATH = '/etc/app/tls/ca.crt'; 
    let vaultCaCert = null;

    try {
        if (fs.existsSync(VAULT_CA_PATH)) {
            vaultCaCert = fs.readFileSync(VAULT_CA_PATH);
            console.log("Certificado CA de Vault cargado exitosamente para la conexión.");
        } else {
            console.warn(`Advertencia: Certificado CA de Vault no encontrado en ${VAULT_CA_PATH}. La conexión a Vault podría fallar debido a 'unknown certificate authority'.`);
        }
    } catch (readError) {
        console.error("Error al leer el certificado CA de Vault:", readError);
    }

    // Llama a configApp para configurar e inicializar la aplicación Fastify y sus rutas
    const app = await configApp();

    // Establece la instancia de la base de datos en el módulo database.js si es necesario
    setDbInstance(app.db); 

    // Inicializa el cliente de Node.js para Vault.
    const vault = vaultLib({
        apiVersion: "v1",
        endpoint: process.env.VAULT_ADDR || "https://security:8200", 
        token: process.env.VAULT_TOKEN || "root",
        tls: {
            ca: vaultCaCert,
            rejectUnauthorized: vaultCaCert !== null // Mantener esto, la solución es el certificado o la env VAULT_ADDR
        }
    });

    // ! IMPORTANTE: LAS RUTAS YA SE REGISTRAN EN configApp.js. 
    // ! ELIMINADAS LAS LÍNEAS DUPLICADAS DE REGISTRO DE RUTAS QUE ESTABAN AQUÍ.

    // Endpoint para métricas de Prometheus.
    app.get('/metrics', async (req, res) => {
        res.header('Content-Type', Prometheus.register.contentType);
        res.send(await Prometheus.register.metrics());
    });

    // Endpoint de health check para verificar el estado de la aplicación, DB y Vault.
    app.get('/health', async (request, reply) => {
        try {
            // Verifica el estado de la conexión a la base de datos (SQLite).
            const dbStatus = app.db && app.db.open ? 'connected' : 'disconnected';
            let vaultStatus = 'disconnected';
            
            try {
                await vault.health(); 
                vaultStatus = 'connected';
            } catch (vaultError) {
                console.error('Error checking Vault health:', vaultError.message);
            }

            reply.status(200).send({ 
                status: 'OK', 
                db: dbStatus,
                vault: vaultStatus,
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            console.error('Error en el health check de la aplicación:', error);
            reply.status(500).send({ 
                status: 'ERROR',
                error: error.message 
            });
        }
    });

    // Endpoint para obtener secretos de Vault.
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

    // Manejador de errores centralizado para la aplicación Fastify.
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

    const port = process.env.PORT || 3000;

    // Inicia el servidor Fastify.
    app.listen({ port, host: '0.0.0.0' }, (err) => {
        if (err) {
            if (app.db && typeof app.db.close === 'function') {
                app.db.close();
            }
            app.log.error(err);
            process.exit(1);
        }
        console.log(`Servidor escuchando en http://localhost:${port}`);
        console.log('Configuración:');
        console.log('- Entorno:', process.env.NODE_ENV || 'development');
        console.log('- Vault:', process.env.VAULT_ADDR || 'https://security:8200'); 
    });

    // Manejo de la señal SIGINT (Ctrl+C) para un cierre limpio
    process.on('SIGINT', () => {
        if (app.db && typeof app.db.close === 'function') {
            app.db.close();
            console.log('Conexión a SQLite cerrada');
        }
        app.close(() => {
            console.log('Servidor Fastify cerrado');
            process.exit(0);
        });
    });
}

main(); // Llama a la función principal para iniciar la aplicación
