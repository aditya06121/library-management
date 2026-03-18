import { FastifyRequest, FastifyReply } from "fastify";
import { registerUser } from "../services/auth.register.js";
import { failure, success } from "../utils/response.js";

export async function registerHandler(req: FastifyRequest, res: FastifyReply) {
  const { email, name, password } = req.body as {
    email: string;
    password: string;
    name: string;
  };

  const result = await registerUser({ name, email, password });

  if (!result.ok) {
    return res
      .status(409)
      .send(failure(409, result.code, result.details));
  }

  const { accessToken, refreshToken, user } = result;

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
  return res
    .status(201)
    .send(success(201, "USER_CREATED", { user }));
}
