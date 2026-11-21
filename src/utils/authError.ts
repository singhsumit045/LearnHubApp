import { isAxiosError } from 'axios';

type ErrorResponse = {
  message?: unknown;
};

export const getAuthErrorMessage = (error: unknown, fallback: string) => {
  if (!isAxiosError<ErrorResponse>(error)) return fallback;

  const status = error.response?.status;
  const isTimeout = error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT';

  if (isTimeout || (status !== undefined && status >= 500)) {
    return 'Server start ho raha hai, thodi der baad try karo.';
  }
  if (!error.response) return 'Internet check karo.';

  const message = error.response.data?.message;
  if (typeof message === 'string') return message;
  if (Array.isArray(message)) {
    const messages = message.filter((item): item is string => typeof item === 'string');
    if (messages.length) return messages.join('\n');
  }

  return fallback;
};