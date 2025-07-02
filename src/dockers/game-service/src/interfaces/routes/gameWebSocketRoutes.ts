
import CloseSession from "../../application/use-cases/CloseSession";
import UserRepositoryStore from "../../infrastructure/rest/UserRepositoryStore";
import { FastifyInstance } from "fastify/types/instance";
import { UserRepositoryAdapter } from "../../infrastructure/repositories/UserRepositoryAdapter";
import VerifyConnection from "../../application/use-cases/VerifyConnection";
import { GameWebSocketController } from "../controllers/GameWebSocketController";

export default async function gameWebSocketRoutes(fastify: FastifyInstance, data: {userTemplate: UserRepositoryStore}) {
    const userRepository = new UserRepositoryAdapter(data.userTemplate);
    const closeSession = new CloseSession();
    const verifyConnection = new VerifyConnection(userRepository);

    const gameWSController = new GameWebSocketController(closeSession, verifyConnection);
    //fastify.register(fastifyWebsocket);

    fastify.get('/matchmaking',{
        websocket: true,
      }, gameWSController.matchMaking.bind(gameWSController));

    fastify.get('/match/:matchId',{
        websocket: true,
      }, gameWSController.handleMatch.bind(gameWSController));


}