// utils/response.ts

export type ApiError = {
  code: string;
  details?: string;
};

export type ApiResponse<T = unknown> = {
  statusCode: number;
  success: boolean;
  message: string;
  data?: T;
  error?: ApiError;
};

// ---- success response ----
export function success<T>(
  statusCode = 200,
  message: string,
  data?: T,
): ApiResponse<T> {
  return {
    statusCode,
    success: true,
    message,
    ...(data !== undefined && { data }),
  };
}

// ---- failure response ----
export function failure(
  statusCode = 400,
  code: string,
  details?: string,
): ApiResponse {
  return {
    statusCode,
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
    required: ["statusCode", "success", "message"],
    properties: {
      statusCode: { type: "number" },
      success: { type: "boolean", const: true },
      message: { type: "string" },
      ...(dataSchema ? { data: dataSchema } : {}),
    },
  };
}

export function createApiFailureSchema() {
  return {
    type: "object",
    required: ["statusCode", "success", "message", "error"],
    properties: {
      statusCode: { type: "number" },
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
