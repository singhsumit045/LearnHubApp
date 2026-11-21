import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp, NativeStackScreenProps } from '@react-navigation/native-stack';
import type { Course, StudentEnrollment } from '../services/authService';
import { getCourseById } from '../services/courseService';
import { enrollInCourse, getMyCourses } from '../services/studentService';
import { colors } from '../theme/colors';
import { getApiMessage } from '../utils/apiMessage';
import type { RootStackParamList } from '../navigation/RootNavigator';
import AppNavbar from '../components/AppNavbar';
import AppFooter from '../components/AppFooter';
import { useAppTheme } from '../context/ThemeContext';

type Props = NativeStackScreenProps<RootStackParamList, 'CourseDetails'>;
type Nav = NativeStackNavigationProp<RootStackParamList>;

const CourseDetailsScreen = () => {
  const route = useRoute<Props['route']>();
  const navigation = useNavigation<Nav>();
  const { courseId } = route.params;
  const { palette: c } = useAppTheme();
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [enrollment, setEnrollment] = useState<StudentEnrollment | null>(null);
  const [checkingEnrollment, setCheckingEnrollment] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [enrollmentError, setEnrollmentError] = useState('');
  const [enrollmentMessage, setEnrollmentMessage] = useState('');

  const loadCourse = useCallback(async () => {
    setLoading(true);
    setError('');
    setCheckingEnrollment(true);
    try {
      const response = await getCourseById(courseId);
      setCourse(response.data);
    } catch (requestError) {
      setError(getApiMessage(requestError, 'Unable to load course details.'));
    } finally {
      setLoading(false);
    }
    try {
      const response = await getMyCourses();
      const records = Array.isArray(response.data) ? response.data : [];
      setEnrollment(records.find((item) => Number(item.course?.id) === Number(courseId)) ?? null);
    } catch {
      // Enrollment is checked by the backend again when the student enrolls.
    } finally {
      setCheckingEnrollment(false);
    }
  }, [courseId]);

  useFocusEffect(useCallback(() => { loadCourse(); }, [loadCourse]));

  const handleEnroll = async () => {
    setEnrolling(true);
    setEnrollmentError('');
    setEnrollmentMessage('');
    try {
      await enrollInCourse(courseId);
      setEnrollmentMessage('You are enrolled. The course is now available in your dashboard.');
      setEnrollment({ enrollmentId: -1, progress: 0, completed: false, enrolledAt: new Date().toISOString(), course: course! });
    } catch (requestError) {
      const message = getApiMessage(requestError, 'Could not enroll in this course. Please try again.');
      if (message.toLowerCase().includes('already enrolled')) {
        setEnrollmentMessage('You are already enrolled in this course.');
        loadCourse();
      } else setEnrollmentError(message);
    } finally {
      setEnrolling(false);
    }
  };

  if (loading) return (
    <View style={[styles.screen, { backgroundColor: c.bg }]}>
      <AppNavbar />
      <View style={styles.centered}><ActivityIndicator size="large" color={colors.primary} /><Text style={[styles.stateText, { color: c.muted }]}>Loading course…</Text></View>
      <AppFooter />
    </View>
  );

  if (error || !course) return (
    <View style={[styles.screen, { backgroundColor: c.bg }]}>
      <AppNavbar />
      <View style={styles.centered}>
        <Text style={styles.error}>{error || 'Course not found.'}</Text>
        <Pressable style={styles.retryButton} onPress={loadCourse}><Text style={styles.buttonText}>Try again</Text></Pressable>
        <Pressable onPress={() => navigation.goBack()}><Text style={[styles.link, { color: colors.primary }]}>Go back to catalog</Text></Pressable>
      </View>
      <AppFooter />
    </View>
  );

  const cardStyle = { backgroundColor: c.card, borderColor: c.border };
  return (
    <ScrollView style={{ backgroundColor: c.bg }} contentContainerStyle={styles.container}>
      <AppNavbar bleed />
      <Pressable onPress={() => navigation.goBack()} hitSlop={8}><Text style={[styles.back, { color: colors.primary }]}>‹ Course catalog</Text></Pressable>
      {course.thumbnail ? <Image source={{ uri: course.thumbnail }} style={styles.hero} /> : <View style={[styles.hero, styles.heroFallback]}><Text style={styles.fallbackIcon}>▤</Text></View>}
      {!!course.category && <Text style={[styles.category, { color: colors.primary }]}>{course.category}</Text>}
      <Text style={[styles.title, { color: c.text }]}>{course.title}</Text>
      <Text style={[styles.price, { color: c.text }]}>{Number(course.price) > 0 ? `₹${Number(course.price).toLocaleString('en-IN')}` : 'Free course'}</Text>
      <View style={[styles.infoCard, cardStyle]}>
        <Text style={[styles.sectionTitle, { color: c.text }]}>About this course</Text>
        <Text style={[styles.description, { color: c.muted }]}>{course.description || 'No description available.'}</Text>
      </View>
      {!!enrollmentMessage && <Text style={styles.success}>{enrollmentMessage}</Text>}
      {!!enrollmentError && <Text style={styles.error}>{enrollmentError}</Text>}
      {enrollment ? (
        <View style={[styles.infoCard, cardStyle]}>
          <Text style={[styles.enrolledTitle, { color: '#2e7d32' }]}>You’re enrolled</Text>
          <Text style={[styles.description, { color: c.muted }]}>Progress: {Math.round(Number(enrollment.progress || 0))}%</Text>
          <Pressable style={styles.secondaryButton} onPress={() => navigation.navigate('Home')}><Text style={styles.secondaryText}>Go to dashboard</Text></Pressable>
        </View>
      ) : (
        <Pressable style={[styles.primaryButton, (enrolling || checkingEnrollment) && styles.disabled]} onPress={handleEnroll} disabled={enrolling || checkingEnrollment}>
          {enrolling ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>{checkingEnrollment ? 'Checking enrollment…' : 'Enroll in this course'}</Text>}
        </Pressable>
      )}
      <Text style={[styles.note, { color: c.muted }]}>Course content becomes available after enrollment.</Text>
      <AppFooter bleed />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1 },
  container: { padding: 20, paddingBottom: 36 },
  back: { fontWeight: '700', marginBottom: 14 },
  hero: { width: '100%', height: 215, borderRadius: 16, backgroundColor: '#e5edf7' },
  heroFallback: { justifyContent: 'center', alignItems: 'center' },
  fallbackIcon: { color: colors.primary, fontSize: 60, fontWeight: '800' },
  category: { fontWeight: '800', fontSize: 12, marginTop: 18, textTransform: 'uppercase' },
  title: { fontSize: 25, lineHeight: 32, fontWeight: '800', marginTop: 6 },
  price: { fontSize: 18, fontWeight: '800', marginTop: 10 },
  infoCard: { borderWidth: 1, borderRadius: 15, padding: 17, marginTop: 20 },
  sectionTitle: { fontSize: 17, fontWeight: '800' },
  description: { fontSize: 14, lineHeight: 22, marginTop: 9 },
  primaryButton: { backgroundColor: colors.primary, minHeight: 50, borderRadius: 13, justifyContent: 'center', alignItems: 'center', marginTop: 20 },
  disabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontWeight: '800', fontSize: 15 },
  secondaryButton: { alignSelf: 'flex-start', borderWidth: 1, borderColor: colors.primary, borderRadius: 10, paddingHorizontal: 13, paddingVertical: 9, marginTop: 13 },
  secondaryText: { color: colors.primary, fontWeight: '800' },
  enrolledTitle: { fontSize: 16, fontWeight: '800' },
  success: { color: '#2e7d32', fontSize: 13, marginTop: 16, lineHeight: 20 },
  error: { color: '#c62828', textAlign: 'center', lineHeight: 20 },
  link: { fontWeight: '700', marginTop: 14 },
  note: { textAlign: 'center', fontSize: 12, marginTop: 12 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  stateText: { marginTop: 8 },
  retryButton: { backgroundColor: colors.primary, borderRadius: 10, paddingHorizontal: 18, paddingVertical: 11, marginTop: 14 },
});

export default CourseDetailsScreen;
