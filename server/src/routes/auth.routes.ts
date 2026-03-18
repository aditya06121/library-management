import { FastifyInstance } from "fastify";
import { registerHandler } from "../controllers/auth.register.js";
import { registerSchema } from "../schema/auth.schema.js";

export default async function authRoutes(app: FastifyInstance) {
  app.post("/register", { schema: registerSchema }, registerHandler);
}
