import axios from "axios";

interface ApiErrorBody {
  message?: string | string[];
  error?: string | ApiErrorBody;
}

function isApiErrorBody(value: unknown): value is ApiErrorBody {
  return typeof value === "object" && value !== null;
}

function formatMessage(message: string | string[] | undefined): string | undefined {
  if (Array.isArray(message)) {
    return message.join(", ");
  }

  if (typeof message === "string" && message.trim().length > 0) {
    return message;
  }

  return undefined;
}

function getBodyMessage(body: ApiErrorBody): string | undefined {
  const directMessage = formatMessage(body.message);
  if (directMessage) {
    return directMessage;
  }

  if (typeof body.error === "string" && body.error.trim().length > 0) {
    return body.error;
  }

  if (isApiErrorBody(body.error)) {
    return formatMessage(body.error.message);
  }

  return undefined;
}

export function getApiErrorMessage(
  error: unknown,
  fallback = "Something went wrong. Please try again.",
): string {
  if (axios.isAxiosError(error)) {
    const body = error.response?.data;
    if (isApiErrorBody(body)) {
      const message = getBodyMessage(body);
      if (message) {
        return message;
      }
    }
  }

  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }

  return fallback;
}
