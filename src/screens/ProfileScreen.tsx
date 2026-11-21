import React, { useCallback, useState } from 'react';
import {
  Alert,
  ActivityIndicator,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import type { AuthUser } from '../services/authService';
import { getProfile } from '../services/authService';
import { removeProfilePicture, uploadProfilePicture } from '../services/authService';
import { launchImageLibrary } from 'react-native-image-picker';
import { colors } from '../theme/colors';
import { getApiMessage } from '../utils/apiMessage';
import AppNavbar from '../components/AppNavbar';
import AppFooter from '../components/AppFooter';
import { useAppTheme } from '../context/ThemeContext';

const ProfileScreen = () => {
  const { user, logout, updateUser } = useAuth();
  const { palette: c, mode, setTheme } = useAppTheme();
  const [profile, setProfile] = useState<AuthUser | null>(user);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [imageFailed, setImageFailed] = useState(false);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [photoError, setPhotoError] = useState('');
  const [photoViewerOpen, setPhotoViewerOpen] = useState(false);
  const [photoActionsOpen, setPhotoActionsOpen] = useState(false);

  const loadProfile = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await getProfile();
      setProfile(response.data);
      setImageFailed(false);
    } catch (requestError) {
      setError(getApiMessage(requestError, 'Could not refresh your profile. Showing saved account details.'));
      setProfile(user);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useFocusEffect(useCallback(() => { loadProfile(); }, [loadProfile]));

  const displayName = profile?.name?.trim() || 'LearnHub learner';
  const initials = displayName.split(/\s+/).slice(0, 2).map((part) => part.charAt(0)).join('').toUpperCase();
  const photoUrl = profile?.profileImageUrl || null;

  const choosePhoto = async () => {
    setPhotoError('');
    let result: Awaited<ReturnType<typeof launchImageLibrary>>;
    try {
      result = await launchImageLibrary({ mediaType: 'photo', selectionLimit: 1, quality: 0.9, maxWidth: 1600, maxHeight: 1600 });
    } catch (pickerError) {
      const reason = pickerError instanceof Error ? pickerError.message : String(pickerError);
      setPhotoError(`Could not open the photo library${reason ? `: ${reason}` : '. Please try again.'}`);
      return;
    }
    if (result.didCancel) return;
    if (result.errorCode) {
      setPhotoError(result.errorMessage || 'Could not open the photo library.');
      return;
    }
    const asset = result.assets?.[0];
    if (!asset?.uri) {
      setPhotoError('The selected photo could not be read. Please choose another photo.');
      return;
    }
    setPhotoBusy(true);
    try {
      const response = await uploadProfilePicture({ uri: asset.uri, type: asset.type, fileName: asset.fileName });
      const updatedUrl = response.data.profileImageUrl || null;
      setProfile((current) => current ? { ...current, profileImageUrl: updatedUrl } : current);
      await updateUser({ profileImageUrl: updatedUrl });
      setImageFailed(false);
      setPhotoError('');
    } catch (requestError) {
      setPhotoError(getApiMessage(requestError, 'Unable to upload your photo. Please try again.'));
    } finally {
      setPhotoBusy(false);
    }
  };

  const removePhoto = () => Alert.alert('Remove profile photo?', 'Your profile will show your initials until you add another photo.', [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Remove photo', style: 'destructive', onPress: async () => {
      setPhotoBusy(true);
      setPhotoError('');
      try {
        await removeProfilePicture();
        setProfile((current) => current ? { ...current, profileImageUrl: null } : current);
        await updateUser({ profileImageUrl: null });
        setImageFailed(false);
        setPhotoViewerOpen(false);
      } catch (requestError) {
        setPhotoError(getApiMessage(requestError, 'Unable to remove your photo. Please try again.'));
      } finally {
        setPhotoBusy(false);
      }
    } },
  ]);

  const showPhotoActions = () => {
    setPhotoActionsOpen(true);
  };

  const closeActionsAnd = (action: () => void) => {
    setPhotoActionsOpen(false);
    // Wait until the native Modal transition has released the Activity before launching another native UI.
    setTimeout(action, 600);
  };

  return (
    <View style={[styles.screen, { backgroundColor: c.bg }]}>
      <AppNavbar active="Profile" bleed />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.headingRow}>
          <View style={styles.headingText}>
            <Text style={[styles.title, { color: c.text }]}>My profile</Text>
            <Text style={[styles.subtitle, { color: c.muted }]}>Your LearnHub account details</Text>
          </View>
          <Pressable accessibilityRole="button" onPress={loadProfile} disabled={loading} style={[styles.refreshButton, { backgroundColor: c.card, borderColor: c.border }]}>
            <Text style={styles.refreshText}>{loading ? 'Loading…' : 'Refresh'}</Text>
          </Pressable>
        </View>

        {loading && !profile ? (
          <View style={styles.loading}><ActivityIndicator size="large" color={colors.primary} /><Text style={[styles.subtitle, { color: c.muted }]}>Loading profile…</Text></View>
        ) : (
          <>
            <View style={[styles.profileCard, { backgroundColor: c.card, borderColor: c.border }]}>
              <Pressable accessibilityRole="button" accessibilityLabel="Profile photo actions" onPress={showPhotoActions} disabled={photoBusy} style={styles.avatarFrame}>
                {profile?.profileImageUrl && !imageFailed ? (
                  <Image
                    accessibilityLabel={`${displayName} profile photo`}
                    source={{ uri: profile.profileImageUrl }}
                    style={styles.avatar}
                    onError={() => setImageFailed(true)}
                  />
                ) : (
                  <View style={styles.avatarFallback}><Text style={styles.initials}>{initials || 'L'}</Text></View>
                )}
                <View style={styles.photoAction}>
                  {photoBusy ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.photoActionText}>＋</Text>}
                </View>
              </Pressable>
              <Text style={[styles.name, { color: c.text }]}>{displayName}</Text>
              <Text style={[styles.role, { color: colors.primary }]}>{profile?.role || 'Student'}</Text>
              <Text style={[styles.photoHint, { color: c.muted }]}>{photoBusy ? 'Updating photo…' : 'Tap your photo to view, change, or remove it'}</Text>
            </View>

            {!!error && <Text accessibilityRole="alert" style={styles.error}>{error}</Text>}
            {!!photoError && <Text accessibilityRole="alert" style={styles.error}>{photoError}</Text>}
            <View style={[styles.detailsCard, { backgroundColor: c.card, borderColor: c.border }]}>
              <Text style={[styles.sectionTitle, { color: c.text }]}>Account information</Text>
              <View style={[styles.divider, { backgroundColor: c.border }]} />
              <Text style={[styles.fieldLabel, { color: c.muted }]}>Full name</Text>
              <Text style={[styles.fieldValue, { color: c.text }]}>{profile?.name || 'Not provided'}</Text>
              <Text style={[styles.fieldLabel, styles.emailLabel, { color: c.muted }]}>Email address</Text>
              <Text style={[styles.fieldValue, { color: c.text }]}>{profile?.email || 'Not provided'}</Text>
              <Text style={[styles.fieldLabel, styles.emailLabel, { color: c.muted }]}>Account type</Text>
              <Text style={[styles.fieldValue, { color: c.text }]}>{profile?.role || 'Student'}</Text>
            </View>
            <View style={[styles.detailsCard, { backgroundColor: c.card, borderColor: c.border }]}>
              <Text style={[styles.sectionTitle, { color: c.text }]}>Appearance</Text>
              <Text style={[styles.subtitle, { color: c.muted }]}>Choose the app color theme.</Text>
              <View style={styles.themeOptions}>
                <Pressable accessibilityRole="button" accessibilityState={{ selected: mode === 'light' }} onPress={() => setTheme('light')} style={[styles.themeOption, { borderColor: mode === 'light' ? colors.primary : c.border, backgroundColor: mode === 'light' ? '#eaf3fd' : c.card }]}>
                  <Text style={[styles.themeOptionText, { color: c.text }]}>☀  Light</Text>
                </Pressable>
                <Pressable accessibilityRole="button" accessibilityState={{ selected: mode === 'dark' }} onPress={() => setTheme('dark')} style={[styles.themeOption, { borderColor: mode === 'dark' ? colors.primary : c.border, backgroundColor: mode === 'dark' ? '#26384b' : c.card }]}>
                  <Text style={[styles.themeOptionText, { color: c.text }]}>☾  Dark</Text>
                </Pressable>
              </View>
            </View>
          </>
        )}
        <Pressable accessibilityRole="button" onPress={logout} style={styles.logoutButton}>
          <Text style={styles.logoutText}>Log out</Text>
        </Pressable>
        <AppFooter bleed />
      </ScrollView>
      <Modal visible={photoViewerOpen && !!photoUrl && !imageFailed} transparent animationType="fade" onRequestClose={() => setPhotoViewerOpen(false)}>
        <View style={styles.viewer}>
          <Pressable accessibilityRole="button" accessibilityLabel="Close photo" onPress={() => setPhotoViewerOpen(false)} style={styles.viewerClose}><Text style={styles.viewerCloseText}>×</Text></Pressable>
          {!!photoUrl && <Image accessibilityLabel={`${displayName} profile photo enlarged`} source={{ uri: photoUrl }} style={styles.viewerImage} resizeMode="contain" />}
          <Pressable accessibilityRole="button" onPress={() => { setPhotoViewerOpen(false); setTimeout(choosePhoto, 220); }} style={styles.viewerChange}><Text style={styles.viewerChangeText}>Change photo</Text></Pressable>
        </View>
      </Modal>
      <Modal visible={photoActionsOpen} transparent animationType="slide" onRequestClose={() => setPhotoActionsOpen(false)} statusBarTranslucent>
        <View style={styles.actionModalRoot}>
          <Pressable accessibilityRole="button" accessibilityLabel="Close profile photo actions" style={styles.actionScrim} onPress={() => setPhotoActionsOpen(false)} />
          <View style={[styles.actionSheet, { backgroundColor: c.card, paddingBottom: 18 }]}>
            <View style={[styles.sheetHandle, { backgroundColor: c.border }]} />
            <Text style={[styles.sheetTitle, { color: c.text }]}>Profile photo</Text>
            {photoUrl && !imageFailed && <Pressable accessibilityRole="button" onPress={() => { setPhotoActionsOpen(false); setTimeout(() => setPhotoViewerOpen(true), 180); }} style={styles.sheetAction}><Text style={styles.sheetIcon}>◉</Text><Text style={[styles.sheetActionText, { color: c.text }]}>View photo</Text></Pressable>}
            <Pressable accessibilityRole="button" disabled={photoBusy} onPress={() => closeActionsAnd(() => { choosePhoto(); })} style={styles.sheetAction}><Text style={styles.sheetIcon}>▧</Text><Text style={[styles.sheetActionText, { color: c.text }]}>Choose from gallery</Text></Pressable>
            {photoUrl && <Pressable accessibilityRole="button" disabled={photoBusy} onPress={() => closeActionsAnd(removePhoto)} style={styles.sheetAction}><Text style={[styles.sheetIcon, styles.removeIcon]}>⌫</Text><Text style={[styles.sheetActionText, styles.removeText]}>Remove photo</Text></Pressable>}
            <Pressable accessibilityRole="button" onPress={() => setPhotoActionsOpen(false)} style={[styles.cancelAction, { borderColor: c.border }]}><Text style={[styles.cancelText, { color: c.text }]}>Cancel</Text></Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { padding: 20, paddingBottom: 28, flexGrow: 1 },
  headingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 18 },
  headingText: { flex: 1 },
  title: { fontSize: 25, fontWeight: '800' },
  subtitle: { fontSize: 13, lineHeight: 19, marginTop: 4 },
  refreshButton: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, borderWidth: 1 },
  refreshText: { color: colors.primary, fontWeight: '800', fontSize: 12 },
  profileCard: { alignItems: 'center', borderWidth: 1, borderRadius: 18, padding: 22 },
  avatarFrame: { width: 116, height: 116, borderRadius: 58, padding: 3, borderWidth: 2, borderColor: colors.primary, marginBottom: 13 },
  avatar: { width: '100%', height: '100%', borderRadius: 56, backgroundColor: '#e5edf7' },
  avatarFallback: { flex: 1, borderRadius: 56, backgroundColor: '#eaf3fd', alignItems: 'center', justifyContent: 'center' },
  initials: { color: colors.primary, fontSize: 35, fontWeight: '900' },
  name: { fontSize: 20, fontWeight: '800', textAlign: 'center' },
  role: { fontSize: 12, fontWeight: '800', textTransform: 'capitalize', marginTop: 5 },
  photoHint: { fontSize: 11, marginTop: 8 },
  photoAction: { position: 'absolute', right: -2, bottom: 6, width: 34, height: 34, borderRadius: 17, backgroundColor: colors.primary, borderWidth: 2, borderColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  photoActionText: { color: '#fff', fontSize: 22, lineHeight: 24, fontWeight: '700' },
  viewer: { flex: 1, backgroundColor: 'rgba(0,0,0,0.96)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  viewerClose: { position: 'absolute', top: 48, right: 22, width: 42, height: 42, borderRadius: 21, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center', zIndex: 1 },
  viewerCloseText: { color: '#fff', fontSize: 30, lineHeight: 34 },
  viewerImage: { width: '100%', height: '72%' },
  viewerChange: { marginTop: 25, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 22, backgroundColor: colors.primary },
  viewerChangeText: { color: '#fff', fontSize: 14, fontWeight: '800' },
  actionModalRoot: { flex: 1, justifyContent: 'flex-end' },
  actionScrim: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(0,0,0,0.52)' },
  actionSheet: { borderTopLeftRadius: 22, borderTopRightRadius: 22, paddingHorizontal: 20, paddingTop: 10, elevation: 18 },
  sheetHandle: { width: 38, height: 4, borderRadius: 3, alignSelf: 'center', marginBottom: 17 },
  sheetTitle: { fontSize: 17, fontWeight: '900', marginBottom: 8 },
  sheetAction: { minHeight: 54, flexDirection: 'row', alignItems: 'center', gap: 15, borderRadius: 11, paddingHorizontal: 5 },
  sheetIcon: { width: 27, textAlign: 'center', color: colors.primary, fontSize: 21, fontWeight: '800' },
  sheetActionText: { fontSize: 14, fontWeight: '700' },
  removeIcon: { color: '#c62828' },
  removeText: { color: '#c62828' },
  cancelAction: { minHeight: 48, borderWidth: 1, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginTop: 9 },
  cancelText: { fontSize: 14, fontWeight: '800' },
  detailsCard: { borderWidth: 1, borderRadius: 16, padding: 18, marginTop: 16, marginBottom: 20 },
  sectionTitle: { fontSize: 16, fontWeight: '800' },
  divider: { height: 1, marginVertical: 14 },
  fieldLabel: { fontSize: 11, fontWeight: '700' },
  fieldValue: { fontSize: 15, fontWeight: '600', marginTop: 4 },
  emailLabel: { marginTop: 17 },
  error: { color: '#c62828', fontSize: 12, lineHeight: 18, marginTop: 12 },
  loading: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', minHeight: 200 },
  logoutButton: { minHeight: 48, borderRadius: 12, borderWidth: 1, borderColor: '#c62828', alignItems: 'center', justifyContent: 'center', marginBottom: 18 },
  logoutText: { color: '#c62828', fontWeight: '800', fontSize: 14 },
  themeOptions: { flexDirection: 'row', gap: 10, marginTop: 13 },
  themeOption: { flex: 1, borderWidth: 1, borderRadius: 11, alignItems: 'center', paddingVertical: 11 },
  themeOptionText: { fontSize: 13, fontWeight: '800' },
});

export default ProfileScreen;
