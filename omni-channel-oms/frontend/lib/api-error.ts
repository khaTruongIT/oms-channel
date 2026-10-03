import axios from "axios";

interface ApiErrorBody {
  message?: string | string[];
  error?: string;
}

function isApiErrorBody(value: unknown): value is ApiErrorBody {
  return typeof value === "object" && value !== null;
}

export function getApiErrorMessage(
  error: unknown,
  fallback = "Something went wrong. Please try again.",
): string {
  if (axios.isAxiosError(error)) {
    const body = error.response?.data;
    if (isApiErrorBody(body)) {
      if (Array.isArray(body.message)) {
        return body.message.join(", ");
      }
      if (typeof body.message === "string" && body.message.trim().length > 0) {
        return body.message;
      }
      if (typeof body.error === "string" && body.error.trim().length > 0) {
        return body.error;
      }
    }
  }

  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }

  return fallback;
}

