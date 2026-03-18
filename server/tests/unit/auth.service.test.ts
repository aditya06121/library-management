import { describe, it, expect, vi, beforeEach } from "vitest";
import { registerUser } from "../../src/services/auth.register.js";
import { prisma } from "../../src/db.js";
import bcrypt from "bcrypt";

vi.mock("../../src/db.js", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
    session: {
      create: vi.fn(),
    },
  },
}));

vi.mock("bcrypt");
vi.mock("../../src/utils/auth.token.js", () => ({
  generateAccessToken: vi.fn(() => "access-token"),
  generateRefreshToken: vi.fn(() => "refresh-token"),
}));

describe("registerUser", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should create user and return tokens", async () => {
    const email = `${Date.now()}@mail.com`;

    (prisma.user.findUnique as any).mockResolvedValue(null);

    (bcrypt.hash as any).mockResolvedValue("hashed_password");

    (prisma.user.create as any).mockResolvedValue({
      id: "1",
      email,
    });

    (prisma.session.create as any).mockResolvedValue({});

    const result = await registerUser({
      name: "test",
      email,
      password: "123456",
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.user.email).toBe(email);
      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();
    }
  });

  it("should fail if email exists", async () => {
    const email = `${Date.now()}@mail.com`;

    (prisma.user.findUnique as any).mockResolvedValue({
      id: "1",
      email,
    });

    const result = await registerUser({
      name: "test",
      email,
      password: "123456",
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe("EMAIL_EXISTS");
    }
  });
});
