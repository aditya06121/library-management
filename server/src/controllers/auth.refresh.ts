import { FastifyRequest, FastifyReply } from "fastify";
import { failure, success } from "../utils/response.js";
import { refreshAccessToken } from "../services/auth.refresh.js";

export async function refreshHandler(req: FastifyRequest, res: FastifyReply) {
  const refreshToken = req.cookies.refreshToken;

  if (!refreshToken) {
    return res.status(401).send(failure("UNAUTHORIZED", "No token"));
  }

  const result = await refreshAccessToken(refreshToken);

  if (!result.ok) {
    const statusCode = result.code === "DB_CALL_FAILED" ? 500 : 401;

    return res.status(statusCode).send(failure(result.code, result.details));
  }

  res.setCookie("accessToken", result.accessToken, {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
    path: "/",
    maxAge: 15 * 60,
  });

  res.setCookie("refreshToken", result.refreshToken, {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
    path: "/",
    maxAge: 7 * 24 * 60 * 60,
  });
  return res.status(200).send(success("TOKEN_REFRESHED", {}));
}
