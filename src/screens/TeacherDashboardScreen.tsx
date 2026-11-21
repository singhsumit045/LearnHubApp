import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import AppFooter from '../components/AppFooter';
import AppNavbar from '../components/AppNavbar';
import { getTeacherDashboard, type TeacherDashboardData } from '../services/studentService';
import { colors } from '../theme/colors';
import { useAppTheme } from '../context/ThemeContext';
import { getApiMessage } from '../utils/apiMessage';

const emptyDashboard: TeacherDashboardData = {
  totalCourses: 0,
  totalStudents: 0,
  students: [],
  courses: [],
};

const TeacherDashboardScreen = () => {
  const { user } = useAuth();
  const { palette: c } = useAppTheme();
  const [dashboard, setDashboard] = useState<TeacherDashboardData>(emptyDashboard);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const loadDashboard = useCallback(async (refresh = false) => {
    if (refresh) setRefreshing(true);
    else setLoading(true);
    setError('');
    try {
      const { data } = await getTeacherDashboard();
      setDashboard({
        totalCourses: Number(data?.totalCourses || 0),
        totalStudents: Number(data?.totalStudents || 0),
        students: Array.isArray(data?.students) ? data.students : [],
        courses: Array.isArray(data?.courses) ? data.courses : [],
      });
    } catch (requestError) {
      setError(getApiMessage(requestError, 'Unable to load your teacher dashboard.'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { loadDashboard(); }, [loadDashboard]));

  const enrollmentCount = useMemo(
    () => dashboard.courses.reduce((total, course) => total + (course.students?.length || 0), 0),
    [dashboard.courses],
  );
  const cardStyle = { backgroundColor: c.card, borderColor: c.border };
  const titleColor = { color: c.text };
  const mutedColor = { color: c.muted };

  if (loading) {
    return (
      <View style={[styles.screen, { backgroundColor: c.bg }]}>
        <AppNavbar active="Home" />
        <View style={styles.centered}><ActivityIndicator size="large" color={colors.primary} /><Text style={[styles.body, mutedColor]}>Loading your teaching overview…</Text></View>
        <AppFooter />
      </View>
    );
  }

  return (
    <ScrollView
      style={{ backgroundColor: c.bg }}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadDashboard(true)} tintColor={colors.primary} />}
    >
      <AppNavbar active="Home" bleed />
      <View style={[styles.hero, { backgroundColor: c.card, borderColor: c.border }]}>
        <Text style={[styles.eyebrow, { color: colors.primary }]}>TEACHER PORTAL</Text>
        <Text style={[styles.title, titleColor]}>Welcome, {user?.name || 'Teacher'} 👋</Text>
        <Text style={[styles.body, mutedColor]}>A quick view of your courses and the students learning with you.</Text>
      </View>

      {!!error && <View style={styles.errorBox}><Text style={styles.errorText}>{error}</Text><Pressable onPress={() => loadDashboard()}><Text style={styles.retryText}>Retry</Text></Pressable></View>}

      <Text style={[styles.sectionTitle, titleColor]}>Teaching overview</Text>
      <View style={styles.statsGrid}>
        <View style={[styles.statCard, cardStyle]}><Text style={[styles.statLabel, mutedColor]}>My courses</Text><Text style={[styles.statValue, titleColor]}>{dashboard.totalCourses}</Text><Text style={[styles.statDetail, mutedColor]}>Courses you teach</Text></View>
        <View style={[styles.statCard, cardStyle]}><Text style={[styles.statLabel, mutedColor]}>Students</Text><Text style={[styles.statValue, titleColor]}>{dashboard.totalStudents}</Text><Text style={[styles.statDetail, mutedColor]}>Unique learners</Text></View>
        <View style={[styles.statCard, cardStyle]}><Text style={[styles.statLabel, mutedColor]}>Enrollments</Text><Text style={[styles.statValue, titleColor]}>{enrollmentCount}</Text><Text style={[styles.statDetail, mutedColor]}>Across your courses</Text></View>
      </View>

      <View style={styles.sectionHeader}>
        <View><Text style={[styles.sectionTitle, titleColor]}>My courses</Text><Text style={[styles.bodySmall, mutedColor]}>Courses created by you</Text></View>
        <Text style={[styles.sectionCount, { color: colors.primary }]}>{dashboard.courses.length}</Text>
      </View>
      {dashboard.courses.length === 0 ? (
        <View style={[styles.emptyCard, cardStyle]}><Text style={[styles.cardTitle, titleColor]}>No courses created yet</Text><Text style={[styles.bodySmall, mutedColor]}>Your courses will appear here when they’re available.</Text></View>
      ) : dashboard.courses.map((course) => (
        <View key={course.id} style={[styles.courseCard, cardStyle]}>
          {course.thumbnail ? <Image source={{ uri: course.thumbnail }} style={styles.thumbnail} /> : <View style={[styles.thumbnail, styles.thumbnailFallback]}><Text style={styles.fallbackMark}>LH</Text></View>}
          <View style={styles.courseContent}>
            {!!course.category && <Text style={[styles.category, { color: colors.primary }]} numberOfLines={1}>{course.category}</Text>}
            <Text style={[styles.cardTitle, titleColor]} numberOfLines={2}>{course.title}</Text>
            <Text style={[styles.bodySmall, mutedColor]} numberOfLines={2}>{course.description || 'No description available.'}</Text>
            <Text style={[styles.studentCount, { color: colors.primary }]}>{course.students?.length || 0} {(course.students?.length || 0) === 1 ? 'student' : 'students'}</Text>
          </View>
        </View>
      ))}

      <View style={styles.sectionHeader}>
        <View><Text style={[styles.sectionTitle, titleColor]}>Your students</Text><Text style={[styles.bodySmall, mutedColor]}>Unique students across your courses</Text></View>
        <Text style={[styles.sectionCount, { color: colors.primary }]}>{dashboard.students.length}</Text>
      </View>
      {dashboard.students.length === 0 ? (
        <View style={[styles.emptyCard, cardStyle]}><Text style={[styles.cardTitle, titleColor]}>No students enrolled yet</Text><Text style={[styles.bodySmall, mutedColor]}>Students will appear here after they enroll in one of your courses.</Text></View>
      ) : dashboard.students.map((student) => {
        const initials = student.name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase();
        return (
          <View key={student.id} style={[styles.studentCard, cardStyle]}>
            <View style={styles.avatar}><Text style={styles.avatarText}>{initials || 'S'}</Text></View>
            <View style={styles.studentInfo}>
              <Text style={[styles.cardTitle, titleColor]} numberOfLines={1}>{student.name || 'Student'}</Text>
              <Text style={[styles.bodySmall, mutedColor]}>{student.courses?.length || 0} {(student.courses?.length || 0) === 1 ? 'course' : 'courses'}</Text>
              {!!student.courses?.length && <Text style={[styles.studentCourses, mutedColor]} numberOfLines={2}>{student.courses.map((course) => course.title).join(' • ')}</Text>}
            </View>
          </View>
        );
      })}
      <AppFooter bleed />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { padding: 20, paddingBottom: 36 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  hero: { borderWidth: 1, borderRadius: 18, padding: 20, marginTop: 5 },
  eyebrow: { fontSize: 11, fontWeight: '900', letterSpacing: 1.2 },
  title: { fontSize: 25, lineHeight: 32, fontWeight: '900', marginTop: 7 },
  body: { fontSize: 14, lineHeight: 21, marginTop: 7 },
  bodySmall: { fontSize: 12, lineHeight: 18, marginTop: 5 },
  sectionTitle: { fontSize: 19, fontWeight: '900', marginTop: 24, marginBottom: 10 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  statCard: { width: '48%', flexGrow: 1, minHeight: 112, borderWidth: 1, borderRadius: 15, padding: 14 },
  statLabel: { fontSize: 12, fontWeight: '700' },
  statValue: { fontSize: 26, fontWeight: '900', marginTop: 6 },
  statDetail: { fontSize: 11, marginTop: 2 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginTop: 8 },
  sectionCount: { fontSize: 15, fontWeight: '900', marginTop: 12 },
  courseCard: { borderWidth: 1, borderRadius: 15, overflow: 'hidden', marginBottom: 11 },
  thumbnail: { width: '100%', height: 150, backgroundColor: '#e6effa' },
  thumbnailFallback: { alignItems: 'center', justifyContent: 'center', backgroundColor: '#e8f1fb' },
  fallbackMark: { color: colors.primary, fontSize: 28, fontWeight: '900' },
  courseContent: { padding: 14 },
  category: { fontSize: 10, fontWeight: '900', textTransform: 'uppercase', marginBottom: 5 },
  cardTitle: { fontSize: 14, fontWeight: '800' },
  studentCount: { fontSize: 12, fontWeight: '800', marginTop: 10 },
  emptyCard: { borderWidth: 1, borderRadius: 14, padding: 16, marginBottom: 8 },
  studentCard: { borderWidth: 1, borderRadius: 14, padding: 13, marginBottom: 9, flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', backgroundColor: '#eaf3fd' },
  avatarText: { color: colors.primary, fontSize: 13, fontWeight: '900' },
  studentInfo: { flex: 1 },
  studentCourses: { fontSize: 11, lineHeight: 16, marginTop: 4 },
  errorBox: { borderWidth: 1, borderColor: '#ef9a9a', backgroundColor: '#ffebee', borderRadius: 12, padding: 13, marginTop: 15 },
  errorText: { color: '#b71c1c', fontSize: 13, lineHeight: 19 },
  retryText: { color: colors.primary, fontSize: 12, fontWeight: '900', marginTop: 8 },
});

export default TeacherDashboardScreen;
