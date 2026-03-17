import { FastifyInstance } from "fastify";

export default async function authRoutes(app: FastifyInstance) {
  app.post("/register", async (req, res) => {
    //test
  });
}
