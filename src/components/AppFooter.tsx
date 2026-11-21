import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors } from '../theme/colors';
import type { RootStackParamList } from '../navigation/RootNavigator';
import { useAuth } from '../context/AuthContext';

const AppFooter = ({ bleed = false }: { bleed?: boolean }) => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { user } = useAuth();

  return (
    <View style={[styles.container, bleed && styles.bleed]}>
      <View style={styles.brandRow}>
        <Text style={styles.brand}>LearnHub</Text>
        <Text style={styles.tagline}>Learn • Grow • Achieve</Text>
      </View>
      <View style={styles.shortcuts}>
        <Pressable accessibilityRole="button" onPress={() => navigation.navigate('Home')}><Text style={styles.shortcut}>Dashboard</Text></Pressable>
        <Pressable accessibilityRole="button" onPress={() => navigation.navigate('CourseCatalog')}><Text style={styles.shortcut}>Courses</Text></Pressable>
        <Pressable accessibilityRole="button" onPress={() => navigation.navigate('Profile')}><Text style={styles.shortcut}>Profile</Text></Pressable>
        <Pressable accessibilityRole="button" onPress={() => navigation.navigate('Notifications')}><Text style={styles.shortcut}>Notifications</Text></Pressable>
        {user?.role === 'teacher' && <Pressable accessibilityRole="button" onPress={() => navigation.navigate('TeacherLiveClasses')}><Text style={styles.shortcut}>Live classes</Text></Pressable>}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { backgroundColor: colors.primaryDark, paddingHorizontal: 18, paddingVertical: 15, gap: 13 },
  bleed: { marginHorizontal: -20, marginBottom: -28 },
  brandRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  brand: { color: '#fff', fontSize: 13, fontWeight: '900' },
  tagline: { color: '#d8e8fa', fontSize: 11 },
  shortcuts: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.25)', paddingTop: 11 },
  shortcut: { color: '#fff', fontSize: 12, fontWeight: '700' },
});

export default AppFooter;
