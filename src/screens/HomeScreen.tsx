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
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import { colors } from '../theme/colors';
import { getMyCertificates, getMyCourses, getStudentLiveClasses } from '../services/studentService';
import type { StudentEnrollment, StudentLiveClass } from '../services/authService';
import { getApiMessage } from '../utils/apiMessage';
import type { RootStackParamList } from '../navigation/RootNavigator';
import AppNavbar from '../components/AppNavbar';
import AppFooter from '../components/AppFooter';
import { useAppTheme } from '../context/ThemeContext';
import TeacherDashboardScreen from './TeacherDashboardScreen';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const DashboardStat = ({ label, value, detail, textColor, mutedColor, cardColor, borderColor }: {
  label: string;
  value: string | number;
  detail: string;
  textColor: string;
  mutedColor: string;
  cardColor: string;
  borderColor: string;
}) => (
  <View style={[styles.statCard, { backgroundColor: cardColor, borderColor }]}>
    <Text style={[styles.statLabel, { color: mutedColor }]}>{label}</Text>
    <Text style={[styles.statValue, { color: textColor }]}>{value}</Text>
    <Text style={[styles.statDetail, { color: mutedColor }]}>{detail}</Text>
  </View>
);

const StudentDashboardScreen = () => {
  const { user } = useAuth();
  const navigation = useNavigation<Nav>();
  const { palette: c } = useAppTheme();
  const [courses, setCourses] = useState<StudentEnrollment[]>([]);
  const [certificatesCount, setCertificatesCount] = useState(0);
  const [liveClasses, setLiveClasses] = useState<StudentLiveClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errors, setErrors] = useState<{ courses?: string; certificates?: string; live?: string }>({});

  const loadDashboard = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    const results = await Promise.allSettled([
      getMyCourses(),
      getMyCertificates(),
      getStudentLiveClasses(),
    ]);
    const nextErrors: typeof errors = {};
    if (results[0].status === 'fulfilled') {
      const body = results[0].value.data;
      setCourses(Array.isArray(body) ? body : []);
    } else nextErrors.courses = getApiMessage(results[0].reason, 'Unable to load your courses.');
    if (results[1].status === 'fulfilled') {
      const body = results[1].value.data;
      setCertificatesCount(Array.isArray(body) ? body.length : 0);
    } else nextErrors.certificates = getApiMessage(results[1].reason, 'Unable to load certificates.');
    if (results[2].status === 'fulfilled') {
      const body = results[2].value.data;
      setLiveClasses(Array.isArray(body) ? body : []);
    } else nextErrors.live = getApiMessage(results[2].reason, 'Unable to load live classes.');
    setErrors(nextErrors);
    setLoading(false);
    setRefreshing(false);
  }, []);

  useFocusEffect(useCallback(() => {
    loadDashboard();
  }, [loadDashboard]));

  const completedCount = courses.filter((item) => item.completed).length;
  const averageProgress = useMemo(() => courses.length
    ? Math.round(courses.reduce((sum, item) => sum + Number(item.progress || 0), 0) / courses.length)
    : 0, [courses]);
  const pageStyle = { backgroundColor: c.bg };
  const cardStyle = { backgroundColor: c.card, borderColor: c.border };
  const textStyle = { color: c.text };
  const mutedStyle = { color: c.muted };

  if (loading) return (
    <View style={[styles.loadingScreen, pageStyle]}>
      <AppNavbar active="Home" />
      <View style={styles.centered}><ActivityIndicator size="large" color={colors.primary} /><Text style={[styles.body, mutedStyle]}>Loading your learning overview…</Text></View>
      <AppFooter />
    </View>
  );

  return (
    <ScrollView
      style={pageStyle}
      contentContainerStyle={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadDashboard(true)} tintColor={colors.primary} />}
    >
      <AppNavbar active="Home" bleed />
      <View style={styles.topRow}>
        <View style={styles.greeting}>
          <Text style={[styles.eyebrow, { color: colors.primary }]}>STUDENT DASHBOARD</Text>
          <Text style={[styles.title, textStyle]}>Welcome back, {user?.name || 'Student'} 👋</Text>
        </View>
      </View>
      <Text style={[styles.body, mutedStyle]}>Keep learning at your own pace. Your courses and progress are here.</Text>

      <Pressable style={styles.primaryButton} onPress={() => navigation.navigate('CourseCatalog')}>
        <Text style={styles.primaryButtonText}>Explore courses  ›</Text>
      </Pressable>

      <Text style={[styles.sectionTitle, textStyle]}>Your learning overview</Text>
      {!!errors.courses && <Text style={styles.error}>{errors.courses}</Text>}
      <View style={styles.statsGrid}>
        <DashboardStat label="Enrolled courses" value={courses.length} detail="Currently learning" textColor={c.text} mutedColor={c.muted} cardColor={c.card} borderColor={c.border} />
        <DashboardStat label="Completed" value={completedCount} detail="Courses completed" textColor={c.text} mutedColor={c.muted} cardColor={c.card} borderColor={c.border} />
        <DashboardStat label="Overall progress" value={`${averageProgress}%`} detail="Average across courses" textColor={c.text} mutedColor={c.muted} cardColor={c.card} borderColor={c.border} />
        <DashboardStat label="Certificates" value={errors.certificates ? '—' : certificatesCount} detail={errors.certificates ? 'Could not load' : 'Earned'} textColor={c.text} mutedColor={c.muted} cardColor={c.card} borderColor={c.border} />
      </View>
      {courses.length === 0 && !errors.courses ? (
        <View style={[styles.emptyCard, cardStyle]}>
          <Text style={[styles.cardTitle, textStyle]}>Your courses will show up here</Text>
          <Text style={[styles.body, mutedStyle]}>Browse the catalog and enroll to start learning.</Text>
          <Pressable onPress={() => navigation.navigate('CourseCatalog')}><Text style={[styles.link, { color: colors.primary }]}>Browse course catalog</Text></Pressable>
        </View>
      ) : null}
      {courses.length > 0 && (
        <>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, textStyle]}>Continue learning</Text>
            <Pressable onPress={() => navigation.navigate('CourseCatalog')}><Text style={[styles.link, { color: colors.primary }]}>Catalog</Text></Pressable>
          </View>
          {courses.slice(0, 4).map((enrollment) => (
            <Pressable key={enrollment.enrollmentId} style={[styles.courseCard, cardStyle]} onPress={() => navigation.navigate('CourseDetails', { courseId: enrollment.course.id })}>
              {enrollment.course.thumbnail ? <Image source={{ uri: enrollment.course.thumbnail }} style={styles.thumbnail as import('react-native').ImageStyle} /> : <View style={[styles.thumbnail, styles.thumbnailFallback]}><Text style={styles.fallbackIcon}>▤</Text></View>}
              <View style={styles.courseInfo}>
                <Text style={[styles.cardTitle, textStyle]} numberOfLines={2}>{enrollment.course.title}</Text>
                <Text style={[styles.bodySmall, mutedStyle]}>{enrollment.completed ? 'Completed' : `${Math.round(Number(enrollment.progress || 0))}% complete`}</Text>
                <View style={styles.progressTrack}><View style={[styles.progressFill, { width: `${Math.max(0, Math.min(100, Number(enrollment.progress || 0)))}%` }]} /></View>
              </View>
            </Pressable>
          ))}
        </>
      )}

      <View style={styles.sectionHeader}>
        <View><Text style={[styles.sectionTitle, textStyle]}>Live classes</Text><Text style={[styles.bodySmall, mutedStyle]}>Classes available to students</Text></View>
        {liveClasses.length > 0 && <Text style={[styles.countBadge, { color: colors.primary }]}>{liveClasses.length}</Text>}
      </View>
      {!!errors.live && <Text style={styles.error}>{errors.live}</Text>}
      {liveClasses.length === 0 && !errors.live ? (
        <View style={[styles.emptyCard, cardStyle]}><Text style={[styles.cardTitle, textStyle]}>No live classes available</Text><Text style={[styles.body, mutedStyle]}>Your teacher’s upcoming classes will appear here.</Text></View>
      ) : liveClasses.slice(0, 4).map((item) => (
        <View key={item.id} style={[styles.liveCard, cardStyle]}>
          <View style={styles.liveTitleRow}><Text style={[styles.cardTitle, textStyle]} numberOfLines={2}>{item.title}</Text><Text style={[styles.liveStatus, { color: item.isLive ? '#d32f2f' : colors.primary }]}>{item.isLive ? 'LIVE' : 'UPCOMING'}</Text></View>
          {!!item.scheduledAt && <Text style={[styles.bodySmall, mutedStyle]}>{new Date(item.scheduledAt).toLocaleString()}</Text>}
          {!!item.description && <Text style={[styles.bodySmall, mutedStyle]} numberOfLines={2}>{item.description}</Text>}
        </View>
      ))}
      <AppFooter bleed />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { padding: 20, paddingBottom: 36 },
  loadingScreen: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  topRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 },
  greeting: { flex: 1 },
  eyebrow: { fontSize: 11, fontWeight: '800', letterSpacing: 1.1, marginBottom: 7 },
  title: { fontSize: 24, fontWeight: '800', lineHeight: 31 },
  body: { fontSize: 14, lineHeight: 21, marginTop: 7 },
  bodySmall: { fontSize: 12, lineHeight: 18, marginTop: 5 },
  primaryButton: { backgroundColor: colors.primary, minHeight: 48, alignItems: 'center', justifyContent: 'center', borderRadius: 13, marginTop: 19, paddingHorizontal: 18 },
  primaryButtonText: { color: '#fff', fontWeight: '800', fontSize: 15 },
  sectionTitle: { fontSize: 19, fontWeight: '800', marginTop: 25, marginBottom: 12 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  statCard: { width: '48%', flexGrow: 1, borderWidth: 1, borderRadius: 15, padding: 15, minHeight: 105 },
  statLabel: { fontSize: 12, fontWeight: '600' },
  statValue: { fontSize: 25, fontWeight: '800', marginTop: 6 },
  statDetail: { fontSize: 11, marginTop: 3 },
  emptyCard: { borderWidth: 1, borderRadius: 15, padding: 17, marginTop: 8 },
  cardTitle: { fontSize: 15, fontWeight: '700', flexShrink: 1 },
  link: { fontWeight: '700', marginTop: 12 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 },
  courseCard: { borderWidth: 1, borderRadius: 15, padding: 11, marginBottom: 10, flexDirection: 'row', gap: 12, alignItems: 'center' },
  thumbnail: { width: 82, height: 76, borderRadius: 10, backgroundColor: '#e6effa' },
  thumbnailFallback: { alignItems: 'center', justifyContent: 'center', backgroundColor: '#e8f1fb' },
  fallbackIcon: { color: colors.primary, fontSize: 27, fontWeight: '800' },
  courseInfo: { flex: 1 },
  progressTrack: { height: 6, borderRadius: 4, backgroundColor: '#e5e7eb', overflow: 'hidden', marginTop: 9 },
  progressFill: { height: 6, backgroundColor: colors.primary, borderRadius: 4 },
  countBadge: { fontWeight: '800' },
  liveCard: { borderWidth: 1, borderRadius: 15, padding: 15, marginBottom: 10, gap: 3 },
  liveTitleRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 8, alignItems: 'flex-start' },
  liveStatus: { fontWeight: '800', fontSize: 10 },
  error: { color: '#c62828', fontSize: 13, marginVertical: 5 },
});

const RoleDashboardUnavailable = () => {
  const { user } = useAuth();
  const { palette: c } = useAppTheme();
  return (
    <View style={[styles.loadingScreen, { backgroundColor: c.bg }]}>
      <AppNavbar active="Home" />
      <View style={styles.centered}>
        <Text style={[styles.title, { color: c.text }]}>Dashboard unavailable</Text>
        <Text style={[styles.body, { color: c.muted }]}>The mobile dashboard for {user?.role || 'this account type'} isn’t available yet.</Text>
      </View>
      <AppFooter />
    </View>
  );
};

const HomeScreen = () => {
  const { user } = useAuth();

  if (user?.role === 'teacher') return <TeacherDashboardScreen />;
  if (user?.role === 'student') return <StudentDashboardScreen />;
  return <RoleDashboardUnavailable />;
};

export default HomeScreen;
