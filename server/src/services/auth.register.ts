import { prisma } from "../db.js";
import bcrypt from "bcrypt";
import {
  generateAccessToken,
  generateRefreshToken,
} from "../utils/auth.token.js";

type RegisterInput = {
  name: string;
  email: string;
  password: string;
};

export type RegisterUserResult =
  | {
      ok: true;
      user: {
        id: number;
        email: string;
      };
      accessToken: string;
      refreshToken: string;
    }
  | {
      ok: false;
      code: "EMAIL_EXISTS";
      details: string;
    };

export async function registerUser(input: RegisterInput) {
  const { name, email, password } = input;

  const existing = await prisma.user.findUnique({
    where: { email },
  });

  if (existing) {
    return {
      ok: false,
      code: "EMAIL_EXISTS",
      details: "Email already exists",
    } satisfies RegisterUserResult;
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
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

  const payload = { userId: user.id, email: user.email };

  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload);

  const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);

  await prisma.session.create({
    data: {
      userId: user.id,
      refreshToken: hashedRefreshToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7d
    },
  });

  return {
    ok: true,
    user,
    accessToken,
    refreshToken,
  } satisfies RegisterUserResult;
}
