import React, { createContext, useContext, useRef, useState, useCallback } from 'react';
import { Animated, Text, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';

type ToastType = 'success' | 'error' | 'info';

interface ToastOptions {
  message: string;
  type?: ToastType;
  duration?: number;
}

interface ToastCtx {
  show: (opts: ToastOptions | string) => void;
}

const ToastContext = createContext<ToastCtx>({ show: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

const ICONS: Record<ToastType, string> = {
  success: 'checkmark-circle',
  error:   'close-circle',
  info:    'information-circle',
};

const COLORS: Record<ToastType, { bg: string; text: string; icon: string }> = {
  success: { bg: '#f0fdf4', text: '#15803d', icon: '#22c55e' },
  error:   { bg: '#fef2f2', text: '#dc2626', icon: '#ef4444' },
  info:    { bg: '#eef2ff', text: '#4338ca', icon: Colors.primary },
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState('');
  const [type, setType]       = useState<ToastType>('success');
  const opacity   = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-20)).current;
  const timer     = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const show = useCallback((opts: ToastOptions | string) => {
    const options = typeof opts === 'string' ? { message: opts } : opts;
    const { message: msg, type: t = 'success', duration = 2800 } = options;

    if (timer.current) clearTimeout(timer.current);

    setMessage(msg);
    setType(t);
    setVisible(true);

    Animated.parallel([
      Animated.timing(opacity,    { toValue: 1, duration: 250, useNativeDriver: true }),
      Animated.spring(translateY, { toValue: 0, tension: 100, friction: 8, useNativeDriver: true }),
    ]).start();

    timer.current = setTimeout(() => {
      Animated.parallel([
        Animated.timing(opacity,    { toValue: 0, duration: 220, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: -20, duration: 220, useNativeDriver: true }),
      ]).start(() => setVisible(false));
    }, duration);
  }, []);

  const c = COLORS[type];

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      {visible && (
        <Animated.View style={[styles.toast, { backgroundColor: c.bg, opacity, transform: [{ translateY }] }]}>
          <Ionicons name={ICONS[type] as any} size={20} color={c.icon} />
          <Text style={[styles.text, { color: c.text }]} numberOfLines={2}>{message}</Text>
        </Animated.View>
      )}
    </ToastContext.Provider>
  );
}

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    top: 56,
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 8,
    zIndex: 9999,
  },
  text: { flex: 1, fontSize: 14, fontWeight: '600', lineHeight: 20 },
});
