import { isAxiosError } from 'axios';

export const getApiMessage = (error: unknown, fallback: string) => {
  if (!isAxiosError(error)) return fallback;
  const message = error.response?.data?.message;
  if (typeof message === 'string') return message;
  if (Array.isArray(message)) return message.filter((item): item is string => typeof item === 'string').join('\n') || fallback;
  return fallback;
};
