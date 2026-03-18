import { afterAll, beforeAll, describe, expect, it } from "vitest";
import app from "../../src/app.js";

function buildPayload() {
  return {
    name: "aditya",
    email: `${Date.now()}@mail.com`,
    password: "123456",
  };
}

describe("POST /auth/register", () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it("should return 201, persist the user, and set auth cookies", async () => {
    const payload = buildPayload();

    const res = await app.inject({
      method: "POST",
      url: "/auth/register",
      payload,
    });

    const body = res.json();

    expect(res.statusCode).toBe(201);
    expect(body).toMatchObject({
      statusCode: 201,
      success: true,
      message: "USER_CREATED",
      data: {
        user: {
          email: payload.email,
        },
      },
    });
    expect(body.data.accessToken).toBeUndefined();
    expect(body.data.refreshToken).toBeUndefined();

    expect(res.cookies).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: "accessToken",
        }),
        expect.objectContaining({
          name: "refreshToken",
        }),
      ]),
    );
  });

  it("should return 409 when email already exists", async () => {
    const payload = buildPayload();

    const first = await app.inject({
      method: "POST",
      url: "/auth/register",
      payload,
    });

    expect(first.statusCode).toBe(201);

    const second = await app.inject({
      method: "POST",
      url: "/auth/register",
      payload,
    });

    expect(second.statusCode).toBe(409);
    expect(second.cookies).toHaveLength(0);
    expect(second.json()).toMatchObject({
      statusCode: 409,
      success: false,
      message: "Request failed",
      error: {
        code: "EMAIL_EXISTS",
      },
    });
  });
});
