import { FastifyRequest, FastifyReply } from "fastify";

interface RegisterBody {
  name: string;
  email: string;
  password: string;
}

export async function registerController(
  req: FastifyRequest<{ Body: RegisterBody }>,
  reply: FastifyReply,
) {
  const { name, email, password } = req.body;
  const user = await registerUser({ name, email, password });
  return reply.status(201).send({ message: "User Created" });
}
