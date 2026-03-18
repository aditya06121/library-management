import { logoutUser } from "../services/auth.logout.js";
import { FastifyRequest, FastifyReply } from "fastify";
import { failure, success } from "../utils/response.js";

export async function logoutHandler(req: FastifyRequest, res: FastifyReply) {
  const refreshToken = req.cookies.refreshToken;

  if (refreshToken) {
    const result = await logoutUser(refreshToken);

    if (!result.ok && result.code === "DB_CALL_FAILED") {
      return res.status(500).send(failure(result.code, result.details));
    }
  }

  // always clear cookies (even if invalid)
  res.clearCookie("accessToken", { path: "/" });
  res.clearCookie("refreshToken", { path: "/" });

  return res.status(200).send(success("LOGGED_OUT", {}));
}
