import {
  createApiFailureSchema,
  createApiSuccessSchema,
} from "../utils/response.js";

const registerSuccessDataSchema = {
  type: "object",
  required: ["user"],
  properties: {
    user: {
      type: "object",
      required: ["id", "email"],
      properties: {
        id: { type: "string" },
        email: { type: "string", format: "email" },
      },
    },
  },
};

export const registerSchema = {
  body: {
    type: "object",
    required: ["email", "password", "name"],
    properties: {
      email: { type: "string", format: "email" },
      password: { type: "string", minLength: 6 },
      name: { type: "string" },
    },
  },
  response: {
    201: createApiSuccessSchema(registerSuccessDataSchema),
    409: createApiFailureSchema(),
  },
};
