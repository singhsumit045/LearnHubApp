import api from './api';
import type { StudentEnrollment, StudentLiveClass } from './authService';

export type CertificateSummary = { id: number; course?: { title?: string }; certificateNumber?: string };

export type TeacherDashboardCourse = {
  id: number;
  title: string;
  description: string;
  thumbnail: string | null;
  price: number;
  category: string;
  students: { id: number; name: string }[];
};

export type TeacherDashboardStudent = {
  id: number;
  name: string;
  courses: { id: number; title: string }[];
};

export type TeacherDashboardData = {
  totalCourses: number;
  totalStudents: number;
  students: TeacherDashboardStudent[];
  courses: TeacherDashboardCourse[];
};

export const getMyCourses = () => api.get<StudentEnrollment[]>('/enrollments/my-courses');
export const getMyCertificates = () => api.get<CertificateSummary[]>('/certificates/my');
export const getStudentLiveClasses = () => api.get<StudentLiveClass[]>('/live-classes/student/available');
export const enrollInCourse = (courseId: number) =>
  api.post<{ message: string; enrollment: { id: number } }>('/enrollments', { courseId });
export const getTeacherDashboard = () => api.get<TeacherDashboardData>('/enrollments/teacher/dashboard');
