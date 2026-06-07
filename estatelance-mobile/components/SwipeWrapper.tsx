import React, { useRef } from 'react';
import { Animated, PanResponder, Dimensions } from 'react-native';
import { router, usePathname } from 'expo-router';

const { width: W } = Dimensions.get('window');
const THRESHOLD   = 60;   // swipe uchun minimal px
const RESISTANCE  = 0.25; // harakat qanchalik sezilsin (0–1)
const ANIM_MS     = 220;

const TAB_ORDER = [
  '/',
  '/browse',
  '/messages',
  '/my-works',
  '/favorites',
  '/articles',
  '/profile',
];

export default function SwipeWrapper({ children }: { children: React.ReactNode }) {
  const pathname   = usePathname();
  const translateX = useRef(new Animated.Value(0)).current;

  const snapBack = () =>
    Animated.spring(translateX, {
      toValue: 0, tension: 120, friction: 10, useNativeDriver: true,
    }).start();

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) =>
        Math.abs(g.dx) > 10 && Math.abs(g.dx) > Math.abs(g.dy) * 1.8,

      onPanResponderMove: (_, g) => {
        const currentPath = pathname === '/index' ? '/' : pathname;
        const idx = TAB_ORDER.findIndex(
          t => currentPath === t || currentPath.startsWith(t + '/')
        );
        // Chegara bo'lsa harakat qilma
        if ((g.dx > 0 && idx <= 0) || (g.dx < 0 && idx >= TAB_ORDER.length - 1)) {
          snapBack();
          return;
        }
        translateX.setValue(g.dx * RESISTANCE);
      },

      onPanResponderRelease: (_, g) => {
        const currentPath = pathname === '/index' ? '/' : pathname;
        const idx = TAB_ORDER.findIndex(
          t => currentPath === t || currentPath.startsWith(t + '/')
        );
        if (idx === -1) { snapBack(); return; }

        const goNext = g.dx < -THRESHOLD && idx < TAB_ORDER.length - 1;
        const goPrev = g.dx > THRESHOLD  && idx > 0;

        if (goNext || goPrev) {
          const toX = goNext ? -W : W;
          Animated.timing(translateX, {
            toValue: toX,
            duration: ANIM_MS,
            useNativeDriver: true,
          }).start(() => {
            translateX.setValue(0);
            router.push(TAB_ORDER[goNext ? idx + 1 : idx - 1] as any);
          });
        } else {
          snapBack();
        }
      },

      onPanResponderTerminate: () => snapBack(),
    })
  ).current;

  return (
    <Animated.View
      style={{ flex: 1, transform: [{ translateX }] }}
      {...panResponder.panHandlers}
    >
      {children}
    </Animated.View>
  );
}
