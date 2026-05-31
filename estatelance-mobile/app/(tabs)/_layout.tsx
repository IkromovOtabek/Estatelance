import React, { useEffect } from 'react';
import { Tabs, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { View, Text, TouchableOpacity } from 'react-native';
import { Colors } from '../../constants/colors';
import { useAuth } from '../../hooks/useAuth';
import { useQuery } from '@apollo/client';
import { GET_UNREAD_COUNT } from '../../apollo/queries';

function TabIcon({ name, focused, badge }: { name: any; focused: boolean; badge?: number }) {
  return (
    <View style={{ alignItems: 'center' }}>
      <Ionicons
        name={focused ? name : `${name}-outline` as any}
        size={24}
        color={focused ? Colors.tabActive : Colors.tabInactive}
      />
      {badge && badge > 0 ? (
        <View style={{
          position: 'absolute', top: -4, right: -8,
          backgroundColor: '#dc2626', borderRadius: 8,
          minWidth: 16, height: 16, alignItems: 'center', justifyContent: 'center',
          paddingHorizontal: 3,
        }}>
          <Text style={{ color: 'white', fontSize: 9, fontWeight: '800' }}>
            {badge > 9 ? '9+' : badge}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

function AddButton() {
  return (
    <View style={{
      width: 50, height: 50, borderRadius: 25,
      backgroundColor: Colors.primary,
      alignItems: 'center', justifyContent: 'center',
      marginBottom: 20,
      shadowColor: Colors.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.4,
      shadowRadius: 8,
      elevation: 6,
    }}>
      <Ionicons name="add" size={28} color="white" />
    </View>
  );
}

export default function TabsLayout() {
  const { user, loading } = useAuth();
  const { data: notifData } = useQuery(GET_UNREAD_COUNT, {
    skip: !user,
    pollInterval: 60_000,
  });

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/(auth)/login');
    }
  }, [user, loading]);

  if (!user) return null;

  const unread = notifData?.getUnreadNotificationCount ?? 0;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: Colors.tabBar,
          borderTopColor: Colors.border,
          height: 64,
          paddingBottom: 8,
          paddingTop: 4,
        },
        tabBarActiveTintColor: Colors.tabActive,
        tabBarInactiveTintColor: Colors.tabInactive,
        tabBarLabelStyle: { fontSize: 10, fontWeight: '600' },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Ishlar',
          tabBarIcon: ({ focused }) => <TabIcon name="briefcase" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="browse"
        options={{
          title: 'Frilanserlar',
          tabBarIcon: ({ focused }) => <TabIcon name="people" focused={focused} />,
        }}
      />
      {/* Center + button */}
      <Tabs.Screen
        name="my-works"
        options={{
          title: '',
          tabBarIcon: () => <AddButton />,
          tabBarLabel: () => null,
        }}
      />
      <Tabs.Screen
        name="articles"
        options={{
          title: 'Maqolalar',
          tabBarIcon: ({ focused }) => <TabIcon name="newspaper" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profil',
          tabBarIcon: ({ focused }) => <TabIcon name="person" focused={focused} />,
        }}
      />
    </Tabs>
  );
}
