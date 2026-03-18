// utils/response.ts

export type ApiError = {
  code: string;
  details?: string;
};

export type ApiResponse<T = unknown> = {
  success: boolean;
  message: string;
  data?: T;
  error?: ApiError;
};

// ---- success response ----
export function success<T>(message: string, data?: T): ApiResponse<T> {
  return {
    success: true,
    message,
    ...(data !== undefined && { data }),
  };
}

// ---- failure response ----
export function failure(code: string, details?: string): ApiResponse {
  return {
    success: false,
    message: "Request failed",
    error: {
      code,
      ...(details && { details }),
    },
  };
}

export function createApiSuccessSchema(dataSchema?: Record<string, unknown>) {
  return {
    type: "object",
    required: ["success", "message"],
    properties: {
      success: { type: "boolean", const: true },
      message: { type: "string" },
      ...(dataSchema ? { data: dataSchema } : {}),
    },
  };
}

export function createApiFailureSchema() {
  return {
    type: "object",
    required: ["success", "message", "error"],
    properties: {
      success: { type: "boolean", const: false },
      message: { type: "string" },
      error: {
        type: "object",
        required: ["code"],
        properties: {
          code: { type: "string" },
          details: { type: "string" },
        },
      },
    },
  };
}
