import jwt from "jsonwebtoken";
import { createHash, randomUUID } from "crypto";
import bcrypt from "bcrypt";

// ---- constants ----
const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET!;
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET!;

const ACCESS_TOKEN_EXPIRY = "15m";
const REFRESH_TOKEN_EXPIRY = "7d";

// ---- payload type ----
export type TokenPayload = {
  userId: string;
  email: string;
};

// ---- generators ----
export function generateAccessToken(payload: TokenPayload) {
  return jwt.sign(payload, ACCESS_TOKEN_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRY,
  });
}

export function generateRefreshToken(payload: TokenPayload) {
  return jwt.sign(payload, REFRESH_TOKEN_SECRET, {
    expiresIn: REFRESH_TOKEN_EXPIRY,
    jwtid: randomUUID(),
  });
}

function digestToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function hashRefreshToken(token: string) {
  return bcrypt.hash(digestToken(token), 10);
}

export async function compareRefreshToken(token: string, hashedToken: string) {
  return bcrypt.compare(digestToken(token), hashedToken);
}

// ---- verifiers ----
export function verifyAccessToken(token: string): TokenPayload {
  const decoded = jwt.verify(token, ACCESS_TOKEN_SECRET);

  if (
    typeof decoded !== "object" ||
    decoded === null ||
    !("userId" in decoded) ||
    !("email" in decoded)
  ) {
    throw new Error("Invalid access token payload");
  }

  return {
    userId: decoded.userId as string,
    email: decoded.email as string,
  };
}

export function verifyRefreshToken(token: string): TokenPayload {
  const decoded = jwt.verify(token, REFRESH_TOKEN_SECRET);

  if (
    typeof decoded !== "object" ||
    decoded === null ||
    !("userId" in decoded) ||
    !("email" in decoded)
  ) {
    throw new Error("Invalid refresh token payload");
  }

  return {
    userId: decoded.userId as string,
    email: decoded.email as string,
  };
}
