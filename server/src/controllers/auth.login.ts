import { FastifyRequest, FastifyReply } from "fastify";
import { failure, success } from "../utils/response.js";
import { loginUser } from "../services/auth.login.js";

export async function loginHandler(req: FastifyRequest, res: FastifyReply) {
  const { email, password } = req.body as {
    email: string;
    password: string;
  };
  const result = await loginUser({ email, password });
  if (!result.ok) {
    const statusCode = result.code === "DB_CALL_FAILED" ? 500 : 401;

    return res.status(statusCode).send(failure(result.code, result.details));
  }
  const { user, accessToken, refreshToken } = result;
  // set access token cookie
  res.setCookie("accessToken", accessToken, {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
    path: "/",
    maxAge: 15 * 60, // 15 min
  });

  // set refresh token cookie
  res.setCookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
    path: "/",
    maxAge: 7 * 24 * 60 * 60, // 7 days
  });

  // return minimal body
  return res.status(200).send(success("LOGGED_IN", { user }));
}
