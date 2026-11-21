import React, { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import AppNavbar from '../components/AppNavbar';
import AppFooter from '../components/AppFooter';
import type { LearnHubNotification } from '../services/notificationService';
import { getNotifications, markAllNotificationsAsRead, markNotificationAsRead } from '../services/notificationService';
import { colors } from '../theme/colors';
import { useAppTheme } from '../context/ThemeContext';
import { getApiMessage } from '../utils/apiMessage';

const NotificationsScreen = () => {
  const { palette: c } = useAppTheme();
  const [items, setItems] = useState<LearnHubNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState('');

  const loadNotifications = useCallback(async (refresh = false) => {
    if (refresh) setRefreshing(true);
    else setLoading(true);
    setError('');
    try {
      const response = await getNotifications();
      setItems(Array.isArray(response.data) ? response.data : []);
    } catch (requestError) {
      setError(getApiMessage(requestError, 'Unable to load notifications.'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { loadNotifications(); }, [loadNotifications]));

  const markRead = async (notification: LearnHubNotification) => {
    if (notification.isRead) return;
    setUpdating(true);
    try {
      await markNotificationAsRead(notification.id);
      setItems((current) => current.map((item) => item.id === notification.id ? { ...item, isRead: true } : item));
    } catch (requestError) {
      setError(getApiMessage(requestError, 'Could not update this notification.'));
    } finally {
      setUpdating(false);
    }
  };

  const markAllRead = async () => {
    setUpdating(true);
    setError('');
    try {
      await markAllNotificationsAsRead();
      setItems((current) => current.map((item) => ({ ...item, isRead: true })));
    } catch (requestError) {
      setError(getApiMessage(requestError, 'Could not mark notifications as read.'));
    } finally {
      setUpdating(false);
    }
  };

  const unreadCount = items.filter((item) => !item.isRead).length;
  const cardStyle = { backgroundColor: c.card, borderColor: c.border };
  const renderItem = ({ item }: { item: LearnHubNotification }) => (
    <Pressable accessibilityRole="button" onPress={() => markRead(item)} style={[styles.notificationCard, cardStyle, !item.isRead && styles.unreadCard]}>
      <View style={styles.titleRow}>
        <Text style={[styles.notificationTitle, { color: c.text }]} numberOfLines={2}>{item.title}</Text>
        {!item.isRead && <View style={styles.unreadDot} />}
      </View>
      <Text style={[styles.message, { color: c.muted }]}>{item.message}</Text>
      <View style={styles.metaRow}>
        <Text style={[styles.meta, { color: c.muted }]}>{item.type.replace(/_/g, ' ')}</Text>
        <Text style={[styles.meta, { color: c.muted }]}>{new Date(item.createdAt).toLocaleString()}</Text>
      </View>
      {!item.isRead && <Text style={styles.markRead}>Tap to mark as read</Text>}
    </Pressable>
  );

  return (
    <View style={[styles.screen, { backgroundColor: c.bg }]}>
      <AppNavbar active="Notifications" />
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={[styles.title, { color: c.text }]}>Notifications</Text>
          <Text style={[styles.subtitle, { color: c.muted }]}>{unreadCount ? `${unreadCount} unread` : 'You’re all caught up'}</Text>
        </View>
        {unreadCount > 0 && <Pressable accessibilityRole="button" onPress={markAllRead} disabled={updating}><Text style={styles.markAll}>{updating ? 'Updating…' : 'Mark all read'}</Text></Pressable>}
      </View>
      {!!error && <Text accessibilityRole="alert" style={styles.error}>{error}</Text>}
      {loading ? (
        <View style={styles.centered}><ActivityIndicator size="large" color={colors.primary} /><Text style={[styles.subtitle, { color: c.muted, marginTop: 8 }]}>Loading notifications…</Text></View>
      ) : error && items.length === 0 ? (
        <View style={styles.centered}><Pressable style={styles.retryButton} onPress={() => loadNotifications()}><Text style={styles.retryText}>Try again</Text></Pressable></View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderItem}
          contentContainerStyle={[styles.listContent, items.length === 0 && styles.emptyList]}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadNotifications(true)} tintColor={colors.primary} />}
          ListEmptyComponent={<View style={styles.empty}><Text style={[styles.emptyTitle, { color: c.text }]}>No notifications yet</Text><Text style={[styles.subtitle, { color: c.muted }]}>Course updates and account activity will appear here.</Text></View>}
          ListFooterComponent={<AppFooter />}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: { paddingHorizontal: 20, paddingTop: 18, paddingBottom: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  headerText: { flex: 1 },
  title: { fontSize: 24, fontWeight: '800' },
  subtitle: { fontSize: 13, lineHeight: 19, marginTop: 4 },
  markAll: { color: colors.primary, fontWeight: '800', fontSize: 12 },
  error: { color: '#c62828', paddingHorizontal: 20, paddingVertical: 8, fontSize: 13 },
  listContent: { paddingHorizontal: 16, paddingBottom: 18 },
  emptyList: { flexGrow: 1, justifyContent: 'center' },
  notificationCard: { borderWidth: 1, borderRadius: 14, padding: 15, marginBottom: 10 },
  unreadCard: { borderLeftWidth: 4, borderLeftColor: colors.primary },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 },
  notificationTitle: { flex: 1, fontSize: 15, fontWeight: '800' },
  unreadDot: { width: 9, height: 9, borderRadius: 5, backgroundColor: colors.primary, marginTop: 5 },
  message: { fontSize: 13, lineHeight: 19, marginTop: 7 },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 8, marginTop: 12 },
  meta: { fontSize: 10, textTransform: 'capitalize', flexShrink: 1 },
  markRead: { color: colors.primary, fontSize: 11, fontWeight: '700', marginTop: 8 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  retryButton: { backgroundColor: colors.primary, paddingHorizontal: 18, paddingVertical: 10, borderRadius: 10 },
  retryText: { color: '#fff', fontWeight: '800' },
  empty: { alignItems: 'center', padding: 28 },
  emptyTitle: { fontSize: 17, fontWeight: '800', textAlign: 'center' },
});

export default NotificationsScreen;
