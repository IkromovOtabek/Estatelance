import React, { useEffect } from 'react';
import { Tabs, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { View, Text, TouchableOpacity } from 'react-native';
import { Colors } from '../../constants/colors';
import { useTheme } from '../../hooks/useThemeContext';
import { useAuth } from '../../hooks/useAuth';
import { useQuery } from '@apollo/client';
import { GET_UNREAD_COUNT, GET_UNREAD_MESSAGE_COUNT } from '../../apollo/queries';

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
  useTheme(); // theme o'zgarganda qayta render uchun
  const { data: notifData } = useQuery(GET_UNREAD_COUNT, {
    skip: !user,
    pollInterval: 30_000,
    fetchPolicy: 'cache-and-network',
  });
  const { data: msgData } = useQuery(GET_UNREAD_MESSAGE_COUNT, {
    skip: !user,
    pollInterval: 8_000,
    fetchPolicy: 'cache-and-network',
  });

  const unreadNotif = notifData?.getUnreadNotificationCount ?? 0;
  const unreadMsg   = msgData?.getUnreadMessageCount ?? 0;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: Colors.tabBar,
          borderTopColor: Colors.border,
          height: 84,
          paddingBottom: 0,
          paddingTop: 0,
          justifyContent: 'center',
        },
        tabBarActiveTintColor: Colors.tabActive,
        tabBarInactiveTintColor: Colors.tabInactive,
        tabBarLabelStyle: { fontSize: 10, fontWeight: '600', marginTop: 2 },
        tabBarItemStyle: { justifyContent: 'center', alignItems: 'center', paddingVertical: 8 },
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
      <Tabs.Screen
        name="messages"
        options={{
          title: 'Xabarlar',
          tabBarIcon: ({ focused }) => <TabIcon name="chatbubble-ellipses" focused={focused} badge={unreadMsg} />,
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
        name="favorites"
        options={{
          title: 'Sevimlilar',
          tabBarIcon: ({ focused }) => <TabIcon name="heart" focused={focused} />,
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
          title: user ? 'Profil' : 'Kirish',
          tabBarIcon: ({ focused }) => <TabIcon name={user ? 'person' : 'log-in'} focused={focused} />,
        }}
        listeners={{
          tabPress: (e) => {
            if (!user) {
              e.preventDefault();
              router.push('/(auth)/login');
            }
          },
        }}
      />
    </Tabs>
  );
}
