import React from 'react';
import { Tabs } from 'expo-router';
import { Text, View, StyleSheet, Platform } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { useUser } from '@/context/UserContext';
import { Redirect } from 'expo-router';
import { Spacing } from '@/constants/Typography';

function TabIcon({ name, focused, color }: { name: string; focused: boolean; color: string }) {
  const icons: Record<string, string> = {
    home: '🏠',
    learn: '🗣️',
    script: '📖',
    review: '🔄',
    settings: '⚙️',
  };

  return (
    <View style={[styles.tabIcon, focused && styles.tabIconFocused]}>
      <Text style={[styles.tabEmoji, { opacity: focused ? 1 : 0.6 }]}>
        {icons[name] || '📱'}
      </Text>
    </View>
  );
}

export default function TabLayout() {
  const { colors } = useTheme();
  const { profile, isLoading } = useUser();

  if (isLoading) return null;
  if (!profile.hasOnboarded) return <Redirect href="/onboarding" />;

  const showScript = profile.path === 'speaking_script';

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.tabIconSelected,
        tabBarInactiveTintColor: colors.tabIconDefault,
        tabBarStyle: {
          backgroundColor: colors.tabBar,
          borderTopColor: colors.tabBarBorder,
          borderTopWidth: 1,
          height: Platform.OS === 'ios' ? 88 : 64,
          paddingBottom: Platform.OS === 'ios' ? 28 : 8,
          paddingTop: 8,
          elevation: 0,
          shadowOpacity: 0,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginTop: 2,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ focused, color }) => <TabIcon name="home" focused={focused} color={color} />,
        }}
      />
      <Tabs.Screen
        name="learn"
        options={{
          title: 'Learn',
          tabBarIcon: ({ focused, color }) => <TabIcon name="learn" focused={focused} color={color} />,
        }}
      />
      <Tabs.Screen
        name="script"
        options={{
          title: 'Script',
          tabBarIcon: ({ focused, color }) => <TabIcon name="script" focused={focused} color={color} />,
          href: showScript ? undefined : null,
        }}
      />
      <Tabs.Screen
        name="review"
        options={{
          title: 'Review',
          tabBarIcon: ({ focused, color }) => <TabIcon name="review" focused={focused} color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ focused, color }) => <TabIcon name="settings" focused={focused} color={color} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabIcon: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 32,
    height: 32,
  },
  tabIconFocused: {
    transform: [{ scale: 1.1 }],
  },
  tabEmoji: {
    fontSize: 22,
  },
});
