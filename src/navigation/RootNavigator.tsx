import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import VerifyEmailScreen from '../screens/auth/VerifyEmailScreen';
import HomeScreen from '../screens/HomeScreen';
import CourseCatalogScreen from '../screens/CourseCatalogScreen';
import CourseDetailsScreen from '../screens/CourseDetailsScreen';
import ProfileScreen from '../screens/ProfileScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import { useAppTheme } from '../context/ThemeContext';
import TeacherLiveClassesScreen from '../screens/TeacherLiveClassesScreen';
import CreateLiveClassScreen from '../screens/CreateLiveClassScreen';

export type RootStackParamList = {
  Login: { successMessage?: string } | undefined;
  Register: undefined;
  VerifyEmail: { email: string };
  Home: undefined;
  CourseCatalog: undefined;
  CourseDetails: { courseId: number };
  Profile: undefined;
  Notifications: undefined;
  TeacherLiveClasses: undefined;
  CreateLiveClass: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const RootNavigator = () => {
  const { user, loading } = useAuth();
  const { palette } = useAppTheme();

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.bg }}>
        <ActivityIndicator size="large" color="#1976d2" />
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {user ? (
        <>
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen name="CourseCatalog" component={CourseCatalogScreen} />
          <Stack.Screen name="CourseDetails" component={CourseDetailsScreen} />
          <Stack.Screen name="Profile" component={ProfileScreen} />
          <Stack.Screen name="Notifications" component={NotificationsScreen} />
          {user.role === 'teacher' && <Stack.Screen name="TeacherLiveClasses" component={TeacherLiveClassesScreen} />}
          {user.role === 'teacher' && <Stack.Screen name="CreateLiveClass" component={CreateLiveClassScreen} />}
        </>
      ) : (
        <>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
          <Stack.Screen name="VerifyEmail" component={VerifyEmailScreen} />
        </>
      )}
    </Stack.Navigator>
  );
};

export default RootNavigator;
