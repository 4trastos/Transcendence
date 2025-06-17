import Prometheus from 'prom-client';
import vaultLib from 'node-vault';
import {userRoutes} from './routes/userRoutes.js';
import {gameRoutes} from './routes/gameRoutes.js';
import {authRoutes} from './routes/authRoutes.js';
import {profileRoutes} from './routes/profileRoutes.js';
import configApp from './configApp.js';
import dotenv from 'dotenv';
import { statsRoutes } from './routes/statsRoutes.js';

dotenv.config();
async function main() {
    const app = await configApp();

    const vault = vaultLib({
        apiVersion: "v1",
        endpoint: process.env.VAULT_ADDR || "http://0.0.0.0:8200",
        token: process.env.VAULT_TOKEN || "root",
    });
    // Rutas

    app.register(authRoutes, { prefix: '/api' });
    app.register(userRoutes, { prefix: '/api' });
    app.register(gameRoutes, { prefix: '/api' });
    app.register(statsRoutes, { prefix: '/api' });
    app.register(profileRoutes, { prefix: '/api' });

    app.get('/metrics', async (req, res) => {
        res.header('Content-Type', Prometheus.register.contentType);
        res.send(await Prometheus.register.metrics());
    });

    // Health check endpoint
    app.get('/health', async (request, reply) => {
        try {
            const dbStatus = app.db.open ? 'connected' : 'disconnected';
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

    const port = process.env.PORT || 3000;

    // Iniciar servidor
    app.listen({ port, host: '0.0.0.0' }, (err) => {
        if (err) {
            app.db.close();
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
        app.db.close();
        console.log('Conexión a SQLite cerrada');
        app.close(() => {
            process.exit();
        });
        process.exit();

    });
 
}

main();
