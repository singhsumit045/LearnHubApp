import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import AppFooter from '../components/AppFooter';
import AppNavbar from '../components/AppNavbar';
import { getMyTeacherCourses } from '../services/courseService';
import type { Course } from '../services/authService';
import { createLiveClass } from '../services/liveClassService';
import type { RootStackParamList } from '../navigation/RootNavigator';
import { useAppTheme } from '../context/ThemeContext';
import { colors } from '../theme/colors';
import { getApiMessage } from '../utils/apiMessage';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const CreateLiveClassScreen = () => {
  const navigation = useNavigation<Nav>();
  const { palette: c } = useAppTheme();
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const loadCourses = useCallback(async () => {
    setLoadingCourses(true);
    setError('');
    try {
      const response = await getMyTeacherCourses();
      const data = Array.isArray(response.data) ? response.data : [];
      setCourses(data);
      if (data.length) setSelectedCourseId((current) => current ?? data[0].id);
    } catch (requestError) {
      setError(getApiMessage(requestError, 'Unable to load your courses.'));
    } finally {
      setLoadingCourses(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { loadCourses(); }, [loadCourses]));

  const handleCreate = async () => {
    setError('');
    setSuccess('');
    const cleanTitle = title.trim();
    if (!cleanTitle) return setError('Enter a class title.');
    if (!selectedCourseId) return setError('Choose a course for this class.');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date.trim())) return setError('Enter the date as YYYY-MM-DD.');
    if (!/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(time.trim())) return setError('Enter the time in 24-hour format, such as 14:30.');
    const scheduledDate = new Date(`${date.trim()}T${time.trim()}:00`);
    if (Number.isNaN(scheduledDate.getTime())) return setError('Enter a valid date and time.');
    if (scheduledDate.getTime() <= Date.now()) return setError('Choose a future date and time.');

    setSaving(true);
    try {
      await createLiveClass({
        title: cleanTitle,
        ...(description.trim() ? { description: description.trim() } : {}),
        courseId: selectedCourseId,
        scheduledAt: scheduledDate.toISOString(),
      });
      setSuccess('Live class scheduled successfully.');
      navigation.navigate('TeacherLiveClasses');
    } catch (requestError) {
      setError(getApiMessage(requestError, 'Unable to schedule this class. Please try again.'));
    } finally {
      setSaving(false);
    }
  };

  const inputStyle = [styles.input, { color: c.text, backgroundColor: c.card, borderColor: c.border }];

  return (
    <ScrollView style={{ backgroundColor: c.bg }} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <AppNavbar active="CreateLiveClass" bleed />
      <Pressable onPress={() => navigation.navigate('TeacherLiveClasses')}><Text style={styles.back}>‹ Live classes</Text></Pressable>
      <Text style={[styles.title, { color: c.text }]}>Create a live class</Text>
      <Text style={[styles.subtitle, { color: c.muted }]}>Schedule a Zoom class for one of your courses.</Text>

      {!!error && <View style={styles.errorBox}><Text style={styles.errorText}>{error}</Text>{!courses.length && !loadingCourses && <Pressable onPress={loadCourses}><Text style={styles.retry}>Retry loading courses</Text></Pressable>}</View>}
      {!!success && <Text style={styles.success}>{success}</Text>}

      <Text style={[styles.label, { color: c.text }]}>Class title</Text>
      <TextInput style={inputStyle} value={title} onChangeText={setTitle} placeholder="e.g. Week 1: Introduction" placeholderTextColor={c.muted} maxLength={120} />

      <Text style={[styles.label, { color: c.text }]}>Description <Text style={[styles.optional, { color: c.muted }]}>Optional</Text></Text>
      <TextInput style={[inputStyle, styles.descriptionInput]} value={description} onChangeText={setDescription} placeholder="What will students learn in this class?" placeholderTextColor={c.muted} multiline maxLength={1000} textAlignVertical="top" />

      <View style={styles.courseHeading}>
        <Text style={[styles.label, styles.courseLabel, { color: c.text }]}>Course</Text>
        {loadingCourses && <ActivityIndicator size="small" color={colors.primary} />}
      </View>
      {!loadingCourses && courses.length === 0 ? (
        <View style={[styles.emptyCard, { backgroundColor: c.card, borderColor: c.border }]}>
          <Text style={[styles.body, { color: c.muted }]}>You need a course before scheduling a class. Create a course first, then return here.</Text>
        </View>
      ) : courses.map((course) => {
        const selected = course.id === selectedCourseId;
        return (
          <Pressable key={course.id} accessibilityRole="radio" accessibilityState={{ checked: selected }} onPress={() => setSelectedCourseId(course.id)} style={[styles.courseOption, { backgroundColor: c.card, borderColor: selected ? colors.primary : c.border }]}>
            <View style={[styles.radio, { borderColor: selected ? colors.primary : c.muted }]}>{selected && <View style={styles.radioSelected} />}</View>
            <View style={styles.courseText}><Text style={[styles.courseTitle, { color: c.text }]} numberOfLines={2}>{course.title}</Text>{!!course.category && <Text style={[styles.courseCategory, { color: c.muted }]}>{course.category}</Text>}</View>
          </Pressable>
        );
      })}

      <Text style={[styles.label, { color: c.text }]}>Date</Text>
      <TextInput style={inputStyle} value={date} onChangeText={setDate} placeholder="YYYY-MM-DD" placeholderTextColor={c.muted} keyboardType="numbers-and-punctuation" maxLength={10} />
      <Text style={[styles.helper, { color: c.muted }]}>Use your device’s local date.</Text>

      <Text style={[styles.label, { color: c.text }]}>Start time</Text>
      <TextInput style={inputStyle} value={time} onChangeText={setTime} placeholder="HH:MM (24-hour)" placeholderTextColor={c.muted} keyboardType="numbers-and-punctuation" maxLength={5} />

      <View style={styles.infoBox}><Text style={[styles.infoText, { color: c.muted }]}>A Zoom meeting link will be attached automatically by LearnHub.</Text></View>
      <Pressable style={[styles.submit, (saving || loadingCourses || courses.length === 0) && styles.disabled]} onPress={handleCreate} disabled={saving || loadingCourses || courses.length === 0}>
        {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>Schedule class</Text>}
      </Pressable>
      <AppFooter bleed />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  content: { padding: 20, paddingBottom: 36 },
  back: { color: colors.primary, fontWeight: '800', marginTop: 8, marginBottom: 12 },
  title: { fontSize: 24, fontWeight: '900' },
  subtitle: { fontSize: 13, lineHeight: 19, marginTop: 5, marginBottom: 13 },
  label: { fontSize: 13, fontWeight: '800', marginTop: 16, marginBottom: 7 },
  optional: { fontSize: 11, fontWeight: '500' },
  input: { minHeight: 48, borderWidth: 1, borderRadius: 12, paddingHorizontal: 13, fontSize: 14 },
  descriptionInput: { minHeight: 95, paddingTop: 12 },
  courseHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  courseLabel: { marginBottom: 8 },
  courseOption: { minHeight: 60, borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', gap: 11, marginBottom: 8 },
  radio: { width: 19, height: 19, borderRadius: 10, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  radioSelected: { width: 9, height: 9, borderRadius: 5, backgroundColor: colors.primary },
  courseText: { flex: 1 },
  courseTitle: { fontSize: 13, fontWeight: '800' },
  courseCategory: { fontSize: 11, marginTop: 3 },
  helper: { fontSize: 11, marginTop: 5 },
  emptyCard: { borderWidth: 1, borderRadius: 12, padding: 13 },
  body: { fontSize: 13, lineHeight: 19 },
  infoBox: { borderRadius: 11, padding: 12, backgroundColor: 'rgba(25,118,210,0.08)', marginTop: 18 },
  infoText: { fontSize: 12, lineHeight: 18 },
  submit: { minHeight: 50, borderRadius: 13, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', marginTop: 16, marginBottom: 20 },
  submitText: { color: '#fff', fontSize: 15, fontWeight: '900' },
  disabled: { opacity: 0.55 },
  errorBox: { borderWidth: 1, borderColor: '#ef9a9a', backgroundColor: '#ffebee', borderRadius: 12, padding: 12, marginTop: 12 },
  errorText: { color: '#b71c1c', fontSize: 12, lineHeight: 18 },
  retry: { color: colors.primary, fontWeight: '800', fontSize: 12, marginTop: 8 },
  success: { color: '#2e7d32', fontSize: 13, fontWeight: '700', marginTop: 8 },
});

export default CreateLiveClassScreen;
