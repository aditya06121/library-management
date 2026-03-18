import { FastifyRequest, FastifyReply } from "fastify";
import { failure } from "../utils/response.js";
import { verifyAccessToken } from "../utils/auth.token.js";

export async function authMiddleware(req: FastifyRequest, res: FastifyReply) {
  const token = req.cookies.accessToken;

  if (!token) {
    return res.status(401).send(failure("UNAUTHORIZED", "No token"));
  }

  try {
    const payload = verifyAccessToken(token);

    // attach user to request
    (req as any).user = payload;
  } catch {
    return res.status(401).send(failure("INVALID_TOKEN", "Invalid token"));
  }
}
