import { prisma } from "../db.js";
import bcrypt from "bcrypt";
import {
  generateAccessToken,
  generateRefreshToken,
  hashRefreshToken,
} from "../utils/auth.token.js";
import { Prisma } from "@prisma/client";

type RegisterInput = {
  name: string;
  email: string;
  password: string;
};

export type RegisterUserResult =
  | {
      ok: true;
      user: {
        id: string;
        email: string;
      };
      accessToken: string;
      refreshToken: string;
    }
  | {
      ok: false;
      code: "EMAIL_EXISTS" | "DB_CALL_FAILED";
      details: string;
    };

export async function registerUser(input: RegisterInput) {
  const { name, email, password } = input;

  const hashedPassword = await bcrypt.hash(password, 10);

  let user: { id: string; email: string };

  // Create user (atomic, concurrency-safe)
  try {
    user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
      },
      select: {
        id: true,
        email: true,
      },
    });
  } catch (e) {
    if (
      e instanceof Prisma.PrismaClientKnownRequestError &&
      e.code === "P2002"
    ) {
      return {
        ok: false,
        code: "EMAIL_EXISTS",
        details: "Email already exists",
      } satisfies RegisterUserResult;
    }

    return {
      ok: false,
      code: "DB_CALL_FAILED",
      details: "Failed to connect to db",
    } satisfies RegisterUserResult;
  }

  const payload = { userId: user.id, email: user.email };

  // Generate refresh token first
  const refreshToken = await generateRefreshToken(payload);
  const hashedRefreshToken = await hashRefreshToken(refreshToken);

  // Store session
  try {
    await prisma.session.create({
      data: {
        userId: user.id,
        refreshToken: hashedRefreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
    });
  } catch {
    return {
      ok: false,
      code: "DB_CALL_FAILED",
      details: "Failed to connect to db",
    } satisfies RegisterUserResult;
  }

  // Generate access token after session is persisted
  const accessToken = await generateAccessToken(payload);

  return {
    ok: true,
    user,
    accessToken,
    refreshToken,
  } satisfies RegisterUserResult;
}
