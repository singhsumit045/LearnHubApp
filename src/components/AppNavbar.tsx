import React, { useCallback, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';
import type { RootStackParamList } from '../navigation/RootNavigator';
import { getUnreadCount } from '../services/notificationService';
import { useAppTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';

type Props = { active?: 'Home' | 'CourseCatalog' | 'Profile' | 'Notifications' | 'TeacherLiveClasses' | 'CreateLiveClass'; bleed?: boolean };
type Nav = NativeStackNavigationProp<RootStackParamList>;

const AppNavbar = ({ active, bleed = false }: Props) => {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const { palette, isDark, toggleTheme } = useAppTheme();
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useFocusEffect(useCallback(() => {
    let activeScreen = true;
    getUnreadCount().then(({ data }) => {
      const count = typeof data === 'number' ? data : Number((data as unknown as { count?: number; unreadCount?: number }).count ?? (data as unknown as { unreadCount?: number }).unreadCount ?? 0);
      if (activeScreen) setUnreadCount(Number.isFinite(count) ? count : 0);
    }).catch(() => {});
    return () => { activeScreen = false; };
  }, []));
  const navItem = (label: string, screen: 'Home' | 'CourseCatalog' | 'Profile' | 'Notifications' | 'TeacherLiveClasses' | 'CreateLiveClass') => {
    const selected = active === screen;
    return (
      <Pressable
        key={screen}
        accessibilityRole="button"
        accessibilityState={{ selected }}
        onPress={() => { setDrawerOpen(false); navigation.navigate(screen); }}
        style={[styles.drawerItem, selected && { backgroundColor: isDark ? '#26384b' : '#eaf3fd' }]}
      >
        <Text style={[styles.drawerItemText, { color: selected ? colors.primary : palette.text }]}>{label}</Text>
        {screen === 'Notifications' && unreadCount > 0 && <View style={styles.badge}><Text style={styles.badgeText}>{unreadCount > 99 ? '99+' : unreadCount}</Text></View>}
      </Pressable>
    );
  };

  return (
    <>
      <View style={[styles.container, { paddingTop: insets.top }, bleed && styles.bleed]}>
        <Pressable accessibilityRole="button" accessibilityLabel="LearnHub home" onPress={() => navigation.navigate('Home')} style={styles.brand}>
          <View style={styles.brandMark}><Text style={styles.brandMarkText}>L</Text></View>
          <Text style={styles.brandName}>LearnHub</Text>
        </Pressable>
        <View style={styles.headerSpacer} />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={unreadCount ? `Notifications, ${unreadCount} unread` : 'Notifications'}
          onPress={() => navigation.navigate('Notifications')}
          style={styles.headerAction}
        >
          <View style={styles.bellIcon}>
            <View style={styles.bellTop} />
            <View style={styles.bellBody} />
            <View style={styles.bellClapper} />
          </View>
          {unreadCount > 0 && <View style={styles.headerBadge}><Text style={styles.badgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text></View>}
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Switch to ${isDark ? 'light' : 'dark'} mode`}
          onPress={toggleTheme}
          style={styles.themeButton}
        >
          <Text style={styles.themeButtonText}>{isDark ? '☀' : '☾'}</Text>
        </Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel="Open navigation menu" accessibilityState={{ expanded: drawerOpen }} onPress={() => setDrawerOpen(true)} style={styles.menuButton}>
          <View style={styles.menuLines}><View style={styles.menuLine} /><View style={styles.menuLine} /><View style={styles.menuLine} /></View>
        </Pressable>
      </View>
      <Modal visible={drawerOpen} transparent animationType="fade" onRequestClose={() => setDrawerOpen(false)} statusBarTranslucent>
        <View style={styles.modalRoot}>
          <Pressable accessibilityRole="button" accessibilityLabel="Close navigation menu" style={styles.scrim} onPress={() => setDrawerOpen(false)} />
          <View style={[styles.drawer, { backgroundColor: palette.card, paddingTop: insets.top + 12 }]}>
            <View style={styles.drawerHeader}>
              <View style={styles.drawerBrand}>
                <View style={styles.brandMark}><Text style={styles.brandMarkText}>L</Text></View>
                <Text style={[styles.drawerTitle, { color: palette.text }]}>LearnHub</Text>
              </View>
              <Pressable accessibilityRole="button" accessibilityLabel="Close menu" onPress={() => setDrawerOpen(false)} style={styles.closeButton}>
                <Text style={[styles.closeText, { color: palette.muted }]}>×</Text>
              </Pressable>
            </View>
            <Text style={[styles.sectionLabel, { color: palette.muted }]}>LEARNING</Text>
            {navItem('Home', 'Home')}
            {navItem('Courses', 'CourseCatalog')}
            {user?.role === 'teacher' && <>
              <Text style={[styles.sectionLabel, styles.accountLabel, { color: palette.muted }]}>TEACHING</Text>
              {navItem('Live classes', 'TeacherLiveClasses')}
              {navItem('Create a class', 'CreateLiveClass')}
            </>}
            <Text style={[styles.sectionLabel, styles.accountLabel, { color: palette.muted }]}>ACCOUNT</Text>
            {navItem('Profile', 'Profile')}
            {navItem('Notifications', 'Notifications')}
            <View style={styles.drawerBottom}>
              <Text style={[styles.drawerCaption, { color: palette.muted }]}>Learn • Grow • Achieve</Text>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  container: { minHeight: 58, backgroundColor: colors.primary, borderBottomWidth: 1, borderBottomColor: colors.primaryDark, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 12 },
  bleed: { marginHorizontal: -20, marginTop: -20 },
  menuButton: { width: 38, height: 38, borderRadius: 11, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.16)' },
  menuLines: { width: 19, gap: 4 },
  menuLine: { height: 2, width: 19, borderRadius: 2, backgroundColor: '#fff' },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  brandMark: { width: 27, height: 27, borderRadius: 8, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  brandMarkText: { color: colors.primary, fontSize: 16, fontWeight: '900' },
  brandName: { color: '#fff', fontSize: 14, fontWeight: '900' },
  headerSpacer: { flex: 1 },
  headerAction: { width: 38, height: 38, borderRadius: 11, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.14)' },
  bellIcon: { width: 20, height: 22, alignItems: 'center', justifyContent: 'flex-end' },
  bellTop: { position: 'absolute', top: 1, width: 5, height: 4, borderTopLeftRadius: 4, borderTopRightRadius: 4, backgroundColor: '#fff' },
  bellBody: { width: 16, height: 14, borderWidth: 2, borderColor: '#fff', borderTopLeftRadius: 9, borderTopRightRadius: 9, borderBottomLeftRadius: 4, borderBottomRightRadius: 4 },
  bellClapper: { width: 5, height: 3, borderRadius: 3, backgroundColor: '#fff', marginTop: 1 },
  headerBadge: { position: 'absolute', right: -2, top: -3, minWidth: 16, height: 16, borderRadius: 8, backgroundColor: '#d32f2f', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3, borderWidth: 1, borderColor: colors.primary },
  themeButton: { width: 38, height: 38, borderRadius: 11, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.14)' },
  themeButtonText: { color: '#fff', fontSize: 21, fontWeight: '800' },
  modalRoot: { flex: 1, flexDirection: 'row', justifyContent: 'flex-end' },
  scrim: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(10,18,30,0.52)' },
  drawer: { width: '82%', maxWidth: 320, height: '100%', paddingHorizontal: 18, paddingBottom: 24, elevation: 18, shadowColor: '#000', shadowOffset: { width: 4, height: 0 }, shadowOpacity: 0.22, shadowRadius: 12 },
  drawerHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 24 },
  drawerBrand: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  drawerTitle: { fontSize: 19, fontWeight: '900' },
  closeButton: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(128,128,128,0.12)' },
  closeText: { fontSize: 27, lineHeight: 30, fontWeight: '400' },
  sectionLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 1.2, marginBottom: 7, marginTop: 4 },
  accountLabel: { marginTop: 22 },
  drawerItem: { minHeight: 48, borderRadius: 11, paddingHorizontal: 13, marginBottom: 4, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  drawerItemText: { fontSize: 14, fontWeight: '700' },
  badge: { minWidth: 22, height: 22, borderRadius: 11, backgroundColor: '#d32f2f', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: '900' },
  drawerBottom: { flex: 1, justifyContent: 'flex-end', alignItems: 'center' },
  drawerCaption: { fontSize: 11, fontWeight: '600' },
});

export default AppNavbar;
