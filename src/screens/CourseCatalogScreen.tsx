import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { Course } from '../services/authService';
import { getCourses } from '../services/courseService';
import { colors } from '../theme/colors';
import { getApiMessage } from '../utils/apiMessage';
import type { RootStackParamList } from '../navigation/RootNavigator';
import AppNavbar from '../components/AppNavbar';
import AppFooter from '../components/AppFooter';
import { useAppTheme } from '../context/ThemeContext';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const CourseCatalogScreen = () => {
  const navigation = useNavigation<Nav>();
  const { palette: c } = useAppTheme();
  const [courses, setCourses] = useState<Course[]>([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const loadCourses = useCallback(async (refresh = false) => {
    if (refresh) setRefreshing(true);
    else setLoading(true);
    setError('');
    try {
      const response = await getCourses();
      setCourses(Array.isArray(response.data) ? response.data : []);
    } catch (requestError) {
      setError(getApiMessage(requestError, 'Unable to load courses. Please try again.'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { loadCourses(); }, [loadCourses]));

  const categories = useMemo(() => ['All', ...Array.from(new Set(courses.map((item) => item.category).filter(Boolean))).sort()], [courses]);
  const visibleCourses = useMemo(() => {
    const query = search.trim().toLowerCase();
    return courses.filter((item) => {
      const matchesText = !query || `${item.title} ${item.description}`.toLowerCase().includes(query);
      return matchesText && (category === 'All' || item.category === category);
    });
  }, [courses, search, category]);

  const renderCourse = ({ item }: { item: Course }) => (
    <Pressable
      accessibilityRole="button"
      style={[styles.courseCard, { backgroundColor: c.card, borderColor: c.border }]}
      onPress={() => navigation.navigate('CourseDetails', { courseId: item.id })}
    >
      {item.thumbnail ? <Image source={{ uri: item.thumbnail }} style={styles.image} /> : <View style={[styles.image, styles.imageFallback]}><Text style={styles.fallbackIcon}>▤</Text></View>}
      <View style={styles.cardContent}>
        <View style={styles.tagRow}>
          {!!item.category && <Text style={[styles.category, { color: colors.primary }]} numberOfLines={1}>{item.category}</Text>}
          <Text style={[styles.price, { color: c.text }]}>{Number(item.price) > 0 ? `₹${Number(item.price).toLocaleString('en-IN')}` : 'Free'}</Text>
        </View>
        <Text style={[styles.courseTitle, { color: c.text }]} numberOfLines={2}>{item.title || 'Untitled course'}</Text>
        <Text style={[styles.description, { color: c.muted }]} numberOfLines={3}>{item.description || 'No description available.'}</Text>
        <Text style={[styles.detailsLink, { color: colors.primary }]}>View course details  ›</Text>
      </View>
    </Pressable>
  );

  return (
    <View style={[styles.screen, { backgroundColor: c.bg }]}>
      <AppNavbar active="CourseCatalog" />
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={10}><Text style={[styles.back, { color: colors.primary }]}>‹ Dashboard</Text></Pressable>
        <Text style={[styles.title, { color: c.text }]}>Explore courses</Text>
        <Text style={[styles.subtitle, { color: c.muted }]}>Find a course and continue your learning journey.</Text>
        <TextInput
          style={[styles.search, { backgroundColor: c.card, borderColor: c.border, color: c.text }]}
          placeholder="Search courses"
          placeholderTextColor={c.muted}
          value={search}
          onChangeText={setSearch}
          returnKeyType="search"
          accessibilityLabel="Search courses"
        />
        {categories.length > 1 && (
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryList}
            data={categories}
            keyExtractor={(item) => item}
            renderItem={({ item }) => {
              const active = item === category;
              return <Pressable onPress={() => setCategory(item)} style={[styles.categoryButton, active && styles.categoryActive, !active && { borderColor: c.border }]}><Text style={[styles.categoryText, { color: active ? '#fff' : c.text }]}>{item}</Text></Pressable>;
            }}
          />
        )}
      </View>
      {loading ? (
        <View style={styles.centered}><ActivityIndicator size="large" color={colors.primary} /><Text style={[styles.stateText, { color: c.muted }]}>Loading courses…</Text></View>
      ) : error ? (
        <View style={styles.centered}><Text style={styles.error}>{error}</Text><Pressable style={styles.retryButton} onPress={() => loadCourses()}><Text style={styles.retryText}>Try again</Text></Pressable></View>
      ) : (
        <FlatList
          data={visibleCourses}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderCourse}
          contentContainerStyle={[styles.listContent, visibleCourses.length === 0 && styles.emptyList]}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadCourses(true)} tintColor={colors.primary} />}
          ListEmptyComponent={<View style={styles.centered}><Text style={[styles.emptyTitle, { color: c.text }]}>{courses.length === 0 ? 'No courses available yet' : 'No matching courses'}</Text><Text style={[styles.stateText, { color: c.muted }]}>{courses.length === 0 ? 'Please check back later.' : 'Try another search or category.'}</Text></View>}
        />
      )}
      <AppFooter />
    </View>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },
  back: { fontWeight: '700', marginBottom: 14 },
  title: { fontSize: 25, fontWeight: '800' },
  subtitle: { marginTop: 5, fontSize: 13, lineHeight: 19 },
  search: { height: 48, borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, marginTop: 16, fontSize: 15 },
  categoryList: { gap: 8, paddingVertical: 13 },
  categoryButton: { borderWidth: 1, borderRadius: 18, paddingHorizontal: 14, paddingVertical: 8 },
  categoryActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  categoryText: { fontSize: 12, fontWeight: '700' },
  listContent: { paddingHorizontal: 20, paddingBottom: 24 },
  emptyList: { flexGrow: 1, justifyContent: 'center' },
  courseCard: { borderWidth: 1, borderRadius: 16, overflow: 'hidden', marginBottom: 14 },
  image: { width: '100%', height: 165, backgroundColor: '#e5edf7' },
  imageFallback: { alignItems: 'center', justifyContent: 'center', backgroundColor: '#e5edf7' },
  fallbackIcon: { fontSize: 48, color: colors.primary, fontWeight: '800' },
  cardContent: { padding: 15 },
  tagRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10 },
  category: { fontSize: 11, fontWeight: '800', flex: 1 },
  price: { fontSize: 13, fontWeight: '800' },
  courseTitle: { fontSize: 17, fontWeight: '800', marginTop: 9 },
  description: { fontSize: 13, lineHeight: 19, marginTop: 6 },
  detailsLink: { fontWeight: '800', marginTop: 12 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  stateText: { fontSize: 13, lineHeight: 20, marginTop: 8, textAlign: 'center' },
  emptyTitle: { fontWeight: '800', fontSize: 17, textAlign: 'center' },
  error: { color: '#c62828', textAlign: 'center', lineHeight: 20 },
  retryButton: { backgroundColor: colors.primary, paddingHorizontal: 18, paddingVertical: 10, borderRadius: 10, marginTop: 14 },
  retryText: { color: '#fff', fontWeight: '800' },
});

export default CourseCatalogScreen;
