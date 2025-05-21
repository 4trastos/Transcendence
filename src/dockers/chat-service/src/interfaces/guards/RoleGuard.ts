import { error } from "console";
import { FastifyReply, FastifyRequest } from "fastify";
import { UserRepositoryPort } from "../../application/ports/UserRepositoryPort";



export default function roleGuard(allowedRoles: string[], userRepository: UserRepositoryPort) {
	return async function (req: FastifyRequest, reply: FastifyReply) {
	  try {
		const decode:{user:string, role:string[]} =await req.jwtVerify();
		//TODO: Check if the user exists in the database
		const user = req.user as { roles: string[] };
		if (!user) {
		  return reply.code(401).send({ error: "Unauthorized" });
		}
		await userRepository.getUserById(decode.user).then((usr) => {
			if (!usr)
				return reply.code(404).send({error: "User not found"});
		});

		if (!user.roles.some((r) => allowedRoles.includes(r))) {
		  return reply.code(403).send({ error: "Forbidden: Role required" });
		}
	  } catch (err) {
		return reply.code(401).send({ error: "Unauthorized" });
	  }
	};
}