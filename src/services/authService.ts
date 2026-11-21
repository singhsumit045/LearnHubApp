import api from './api';
import { storage } from './storage';

export type AuthUser = {
  id: number;
  name: string;
  email: string;
  role: string;
  profileImageUrl?: string | null;
  isEmailVerified?: boolean;
};

export type Course = {
  id: number;
  title: string;
  description: string;
  thumbnail?: string | null;
  price: number | string;
  category: string;
  teacherId?: number;
};

export type StudentEnrollment = {
  enrollmentId: number;
  progress: number;
  completed: boolean;
  enrolledAt: string;
  course: Course;
};

export type StudentLiveClass = {
  id: number;
  title: string;
  description?: string | null;
  courseId: number;
  scheduledAt?: string | null;
  isLive: boolean;
  isCompleted?: boolean;
};

export type LoginResponse = {
  access_token: string;
  refresh_token: string;
  user: AuthUser;
};

export type RegisterRequest = {
  name: string;
  email: string;
  password: string;
  role?: string;
};

export type VerifyEmailRequest = {
  email: string;
  otp: string;
};

export const loginUser = async (data: { email: string; password: string }) => {
  const res = await api.post<LoginResponse>('/auth/login', data);

  await storage.setMany({
    access_token: res.data.access_token,
    refresh_token: res.data.refresh_token,
  });

  if (res.data.user) {
    await storage.setItem('user', JSON.stringify(res.data.user));
  }
  return res;
};

export const register = (data: RegisterRequest) => {
  // TODO: Type this response when a backend response sample is available.
  return api.post<unknown>('/auth/register', data);
};

export const verifyEmail = (data: VerifyEmailRequest) => {
  // TODO: Type this response when a backend response sample is available.
  return api.post<unknown>('/auth/verify-email', data);
};

export const getProfile = () => api.get<AuthUser>('/auth/profile');
export type ProfilePictureResponse = { message?: string; profileImageUrl?: string | null; profileImagePublicId?: string | null };
export const uploadProfilePicture = (file: { uri: string; type?: string; fileName?: string | null }) => {
  const formData = new FormData();
  formData.append('file', {
    uri: file.uri,
    type: file.type || 'image/jpeg',
    name: file.fileName || `profile-${Date.now()}.jpg`,
  } as unknown as Blob);
  return api.post<ProfilePictureResponse>('/users/profile-picture', formData);
};
export const removeProfilePicture = () => api.delete<ProfilePictureResponse>('/users/profile-picture');
export const logoutUser = () => api.post<{ message: string }>('/auth/logout');

export const clearAuth = () =>
  storage.removeMany(['access_token', 'refresh_token', 'user']);
