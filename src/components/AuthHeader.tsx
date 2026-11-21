import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme/colors';
import { useAppTheme } from '../context/ThemeContext';

const AuthHeader = () => {
  const { isDark, toggleTheme, palette } = useAppTheme();
  return (
    <View style={styles.container}>
      <View style={styles.brand}>
        <View style={styles.mark}><Text style={styles.markText}>L</Text></View>
        <Text style={[styles.brandText, { color: palette.text }]}>LearnHub</Text>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Switch to ${isDark ? 'light' : 'dark'} mode`}
        onPress={toggleTheme}
        style={[styles.themeButton, { borderColor: palette.border }]}
      >
        <Text style={[styles.themeText, { color: colors.primary }]}>{isDark ? '☀ Light' : '☾ Dark'}</Text>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { minHeight: 42, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  mark: { width: 32, height: 32, borderRadius: 10, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  markText: { color: '#fff', fontSize: 18, fontWeight: '900' },
  brandText: { fontSize: 16, color: colors.primaryDark, fontWeight: '900' },
  themeButton: { borderWidth: 1, borderColor: '#b8cbe0', borderRadius: 18, paddingHorizontal: 12, paddingVertical: 8 },
  themeText: { color: colors.primaryDark, fontSize: 12, fontWeight: '800' },
});

export default AuthHeader;
