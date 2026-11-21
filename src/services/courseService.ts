import api from './api';
import type { Course } from './authService';

export const getCourses = () => api.get<Course[]>('/courses');
export const getCourseById = (id: number) => api.get<Course>(`/courses/${id}`);
export const getMyTeacherCourses = () => api.get<Course[]>('/courses/my-courses');
