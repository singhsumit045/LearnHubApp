import api from './api';

export type LiveClass = {
  id: number;
  title: string;
  description?: string | null;
  zoomMeetingUrl?: string | null;
  courseId: number;
  scheduledAt: string;
  startedAt?: string | null;
  endedAt?: string | null;
  isLive: boolean;
  isCompleted: boolean;
  isCancelled: boolean;
};

export type CreateLiveClassRequest = {
  title: string;
  description?: string;
  courseId: number;
  scheduledAt: string;
};

export const createLiveClass = (data: CreateLiveClassRequest) => api.post<LiveClass>('/live-classes', data);
export const getMyLiveClasses = () => api.get<LiveClass[]>('/live-classes/teacher/my-classes');
export const startLiveClass = (id: number) => api.post<LiveClass>(`/live-classes/${id}/start`);
export const endLiveClass = (id: number) => api.post<LiveClass>(`/live-classes/${id}/end`);
