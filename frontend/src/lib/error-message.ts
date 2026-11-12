export function errorMessage(error: unknown, fallback: string): string {
  if (typeof error !== 'object' || error === null) return fallback;

  const candidate = error as {
    message?: unknown;
    response?: { data?: { message?: unknown } };
  };
  const message = candidate.response?.data?.message ?? candidate.message;
  return typeof message === 'string' && message.length > 0 ? message : fallback;
}
