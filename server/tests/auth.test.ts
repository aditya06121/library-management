import { describe, it, expect, beforeAll, afterAll } from "vitest";
import supertest from "supertest";
import app from "../src/app.js";

const request = supertest(app.server);

beforeAll(async () => {
  await app.ready;
});

afterAll(async () => {
  await app.close;
});

describe("POST /api/auth/register", async () => {
  it("should return 201 and create a user", () => {
    const res = await request.post("/api/auth/register").send({
      name: "aditya",
      email: "aditya@email.com",
      password: "123456",
    });
    expect(res.statusCode).toBe(201);
    expect(res.body).toMatchObject({ message: "User Created" });
  });
});
