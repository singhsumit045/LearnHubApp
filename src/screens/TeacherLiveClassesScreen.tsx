import React, { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Linking, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import AppFooter from '../components/AppFooter';
import AppNavbar from '../components/AppNavbar';
import type { RootStackParamList } from '../navigation/RootNavigator';
import { getMyTeacherCourses } from '../services/courseService';
import type { Course } from '../services/authService';
import { endLiveClass, getMyLiveClasses, startLiveClass } from '../services/liveClassService';
import type { LiveClass } from '../services/liveClassService';
import { useAppTheme } from '../context/ThemeContext';
import { colors } from '../theme/colors';
import { getApiMessage } from '../utils/apiMessage';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type ClassState = 'Live' | 'Upcoming' | 'Completed' | 'Cancelled';

const getClassState = (item: LiveClass): ClassState => item.isCancelled ? 'Cancelled' : item.isCompleted ? 'Completed' : item.isLive ? 'Live' : 'Upcoming';

const safeZoomUrl = (value?: string | null) => {
  if (!value) return null;
  try {
    const url = new URL(value);
    const host = url.hostname.toLowerCase();
    if (url.protocol !== 'https:' || !['zoom.us', 'zoom.com', 'zoomgov.com'].some((domain) => host === domain || host.endsWith(`.${domain}`))) return null;
    return url.toString();
  } catch {
    return null;
  }
};

const TeacherLiveClassesScreen = () => {
  const navigation = useNavigation<Nav>();
  const { palette: c } = useAppTheme();
  const [classes, setClasses] = useState<LiveClass[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState<number | null>(null);

  const load = useCallback(async (refresh = false) => {
    refresh ? setRefreshing(true) : setLoading(true);
    setError('');
    try {
      const [classResponse, courseResponse] = await Promise.all([getMyLiveClasses(), getMyTeacherCourses()]);
      setClasses(Array.isArray(classResponse.data) ? classResponse.data : []);
      setCourses(Array.isArray(courseResponse.data) ? courseResponse.data : []);
    } catch (requestError) {
      setError(getApiMessage(requestError, 'Unable to load your live classes.'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));
  const courseNames = useMemo(() => new Map(courses.map((course) => [course.id, course.title])), [courses]);

  const openMeeting = async (item: LiveClass) => {
    const url = safeZoomUrl(item.zoomMeetingUrl);
    if (!url) {
      Alert.alert('Meeting link unavailable', 'LearnHub did not return a valid Zoom link for this class.');
      return;
    }
    try {
      await Linking.openURL(url);
    } catch {
      Alert.alert('Unable to open Zoom', 'Check that a browser or Zoom app is available on this device.');
    }
  };

  const handleStart = async (item: LiveClass) => {
    setBusyId(item.id);
    try {
      const response = await startLiveClass(item.id);
      const updated = response.data;
      setClasses((current) => current.map((entry) => entry.id === item.id ? { ...entry, ...updated, isLive: true } : entry));
      await openMeeting({ ...item, ...updated, isLive: true });
    } catch (requestError) {
      Alert.alert('Could not start class', getApiMessage(requestError, 'Please try again.'));
    } finally {
      setBusyId(null);
    }
  };

  const handleEnd = (item: LiveClass) => Alert.alert('End this live class?', 'Students will no longer be able to join this meeting.', [
    { text: 'Keep live', style: 'cancel' },
    { text: 'End class', style: 'destructive', onPress: async () => {
      setBusyId(item.id);
      try {
        const response = await endLiveClass(item.id);
        setClasses((current) => current.map((entry) => entry.id === item.id ? { ...entry, ...response.data, isLive: false, isCompleted: true } : entry));
      } catch (requestError) {
        Alert.alert('Could not end class', getApiMessage(requestError, 'Please try again.'));
      } finally {
        setBusyId(null);
      }
    } },
  ]);

  const statusColor = (state: ClassState) => state === 'Live' ? '#16804a' : state === 'Upcoming' ? colors.primary : c.muted;

  return (
    <ScrollView
      style={{ backgroundColor: c.bg }}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={colors.primary} />}
    >
      <AppNavbar active="TeacherLiveClasses" bleed />
      <View style={styles.headingRow}>
        <View style={styles.headingText}>
          <Text style={[styles.title, { color: c.text }]}>Live classes</Text>
          <Text style={[styles.subtitle, { color: c.muted }]}>Schedule and manage your course sessions.</Text>
        </View>
        <Pressable accessibilityRole="button" onPress={() => navigation.navigate('CreateLiveClass')} style={styles.createButton}>
          <Text style={styles.createButtonText}>＋ Create</Text>
        </Pressable>
      </View>

      {loading ? (
        <View style={styles.stateBox}><ActivityIndicator size="large" color={colors.primary} /><Text style={[styles.stateText, { color: c.muted }]}>Loading live classes…</Text></View>
      ) : error ? (
        <View style={[styles.stateCard, { backgroundColor: c.card, borderColor: c.border }]}>
          <Text style={styles.errorTitle}>Couldn’t load live classes</Text>
          <Text style={[styles.stateText, { color: c.muted }]}>{error}</Text>
          <Pressable onPress={() => load()} style={styles.retryButton}><Text style={styles.retryText}>Try again</Text></Pressable>
        </View>
      ) : classes.length === 0 ? (
        <View style={[styles.stateCard, { backgroundColor: c.card, borderColor: c.border }]}>
          <Text style={[styles.emptyTitle, { color: c.text }]}>No live classes yet</Text>
          <Text style={[styles.stateText, { color: c.muted }]}>Create a class to schedule a session for one of your courses.</Text>
          <Pressable onPress={() => navigation.navigate('CreateLiveClass')} style={styles.retryButton}><Text style={styles.retryText}>Create your first class</Text></Pressable>
        </View>
      ) : classes.map((item) => {
        const state = getClassState(item);
        const isBusy = busyId === item.id;
        const canStart = state === 'Upcoming';
        return (
          <View key={item.id} style={[styles.card, { backgroundColor: c.card, borderColor: c.border }]}>
            <View style={styles.cardTop}>
              <View style={styles.cardHeading}>
                <Text style={[styles.classTitle, { color: c.text }]}>{item.title}</Text>
                <Text style={[styles.courseName, { color: c.muted }]}>{courseNames.get(item.courseId) ?? `Course #${item.courseId}`}</Text>
              </View>
              <View style={[styles.statusPill, { backgroundColor: `${statusColor(state)}18` }]}>
                <Text style={[styles.statusText, { color: statusColor(state) }]}>{state}</Text>
              </View>
            </View>
            {!!item.description && <Text style={[styles.description, { color: c.muted }]}>{item.description}</Text>}
            <Text style={[styles.date, { color: c.text }]}>{new Date(item.scheduledAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</Text>
            {canStart && <Pressable disabled={isBusy} onPress={() => handleStart(item)} style={[styles.actionButton, isBusy && styles.disabled]}>
              {isBusy ? <ActivityIndicator color="#fff" /> : <Text style={styles.actionText}>Start class & join Zoom</Text>}
            </Pressable>}
            {state === 'Live' && <View style={styles.liveActions}>
              <Pressable disabled={isBusy} onPress={() => openMeeting(item)} style={[styles.actionButton, styles.joinButton, isBusy && styles.disabled]}><Text style={styles.actionText}>Join Zoom</Text></Pressable>
              <Pressable disabled={isBusy} onPress={() => handleEnd(item)} style={[styles.endButton, isBusy && styles.disabled]}>{isBusy ? <ActivityIndicator color="#b42318" /> : <Text style={styles.endText}>End class</Text>}</Pressable>
            </View>}
          </View>
        );
      })}
      <AppFooter bleed />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  content: { padding: 20, paddingBottom: 36 },
  headingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginTop: 14, marginBottom: 18 },
  headingText: { flex: 1 },
  title: { fontSize: 24, fontWeight: '900' },
  subtitle: { fontSize: 13, lineHeight: 19, marginTop: 5 },
  createButton: { minHeight: 42, borderRadius: 11, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 13 },
  createButtonText: { color: '#fff', fontSize: 13, fontWeight: '800' },
  stateBox: { minHeight: 180, alignItems: 'center', justifyContent: 'center', gap: 10 },
  stateCard: { borderWidth: 1, borderRadius: 15, padding: 18, alignItems: 'flex-start' },
  stateText: { fontSize: 13, lineHeight: 20, marginTop: 7 },
  errorTitle: { color: '#b42318', fontSize: 16, fontWeight: '800' },
  emptyTitle: { fontSize: 17, fontWeight: '900' },
  retryButton: { marginTop: 14, paddingVertical: 10, paddingHorizontal: 13, borderRadius: 10, backgroundColor: 'rgba(25,118,210,0.1)' },
  retryText: { color: colors.primary, fontSize: 13, fontWeight: '800' },
  card: { borderWidth: 1, borderRadius: 15, padding: 15, marginBottom: 12 },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 },
  cardHeading: { flex: 1 },
  classTitle: { fontSize: 16, fontWeight: '900', lineHeight: 21 },
  courseName: { fontSize: 12, marginTop: 4 },
  statusPill: { borderRadius: 20, paddingHorizontal: 9, paddingVertical: 5 },
  statusText: { fontSize: 10, fontWeight: '900' },
  description: { fontSize: 13, lineHeight: 19, marginTop: 10 },
  date: { fontSize: 12, fontWeight: '700', marginTop: 12 },
  actionButton: { minHeight: 43, borderRadius: 11, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 12, marginTop: 13 },
  joinButton: { flex: 1, marginTop: 0 },
  actionText: { color: '#fff', fontSize: 13, fontWeight: '800' },
  liveActions: { flexDirection: 'row', alignItems: 'center', gap: 9, marginTop: 13 },
  endButton: { minHeight: 43, borderRadius: 11, borderWidth: 1, borderColor: '#f1b5b1', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 12 },
  endText: { color: '#b42318', fontSize: 13, fontWeight: '800' },
  disabled: { opacity: 0.6 },
});

export default TeacherLiveClassesScreen;
