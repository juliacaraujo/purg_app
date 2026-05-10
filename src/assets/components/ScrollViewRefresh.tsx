import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated, Platform, ActivityIndicator, StyleSheet,
  ScrollView, RefreshControl, View,
} from "react-native";
import type { ScrollViewProps } from "react-native";

interface Props extends Omit<ScrollViewProps, "refreshControl"> {
  refreshing: boolean;
  onRefresh: () => void;
  tintColor?: string;
}

const INDICATOR_H = 48;
const THRESHOLD   = 60;
const MAX_DRAG    = 90;

// ─── Web implementation ──────────────────────────────────────────────────────
function WebPullToRefresh({
  refreshing, onRefresh, tintColor = "#007AFF",
  onScroll: extOnScroll, style, children, ...rest
}: Props) {
  const containerRef  = useRef<any>(null);
  const offset        = useRef(new Animated.Value(0)).current;
  const [isPrimed, setIsPrimed] = useState(false);

  // refs for values used inside DOM event listeners (avoid stale closures)
  const atTop         = useRef(true);
  const dragging      = useRef(false);
  const startY        = useRef(0);
  const primedRef     = useRef(false);
  const refreshingRef = useRef(refreshing);
  const onRefreshRef  = useRef(onRefresh);

  useEffect(() => { refreshingRef.current = refreshing; }, [refreshing]);
  useEffect(() => { onRefreshRef.current  = onRefresh;  }, [onRefresh]);

  // Animate back to 0 when refresh completes
  const prevRefreshing = useRef(false);
  useEffect(() => {
    if (prevRefreshing.current && !refreshing) {
      Animated.spring(offset, {
        toValue: 0, useNativeDriver: false, tension: 80, friction: 12,
      }).start();
    }
    prevRefreshing.current = refreshing;
  }, [refreshing]);

  const handleScroll = useCallback((e: any) => {
    atTop.current = (e.nativeEvent.contentOffset?.y ?? 0) <= 0;
    extOnScroll?.(e);
  }, [extOnScroll]);

  // Attach native DOM listeners so we can call preventDefault on touchmove
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const onTouchStart = (e: TouchEvent) => {
      if (atTop.current && !refreshingRef.current) {
        startY.current = e.touches[0].pageY;
        dragging.current = true;
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!dragging.current || refreshingRef.current) return;
      const dy = e.touches[0].pageY - startY.current;

      if (dy > 0 && atTop.current) {
        e.preventDefault(); // stop browser scroll & native pull-to-refresh
        const v = Math.min(dy * 0.55, MAX_DRAG);
        offset.setValue(v);
        const now = v >= THRESHOLD;
        if (now !== primedRef.current) {
          primedRef.current = now;
          setIsPrimed(now);
        }
      } else {
        // user is scrolling down — hand control back to scroll
        dragging.current = false;
        if (primedRef.current) {
          primedRef.current = false;
          setIsPrimed(false);
          Animated.spring(offset, { toValue: 0, useNativeDriver: false }).start();
        }
      }
    };

    const onTouchEnd = () => {
      if (!dragging.current) return;
      dragging.current = false;
      if (primedRef.current && !refreshingRef.current) {
        primedRef.current = false;
        setIsPrimed(false);
        // Lock indicator visible while refresh runs
        Animated.spring(offset, {
          toValue: INDICATOR_H, useNativeDriver: false, tension: 80, friction: 12,
        }).start();
        onRefreshRef.current();
      } else {
        primedRef.current = false;
        setIsPrimed(false);
        Animated.spring(offset, {
          toValue: 0, useNativeDriver: false, tension: 80, friction: 12,
        }).start();
      }
    };

    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchmove",  onTouchMove,  { passive: false });
    el.addEventListener("touchend",   onTouchEnd,   { passive: true });

    return () => {
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove",  onTouchMove);
      el.removeEventListener("touchend",   onTouchEnd);
    };
  }, []); // listeners are stable — they read values through refs

  const indicatorY = offset.interpolate({
    inputRange: [0, INDICATOR_H],
    outputRange: [-INDICATOR_H, 0],
    extrapolate: "clamp",
  });
  const contentY = offset.interpolate({
    inputRange: [0, MAX_DRAG],
    outputRange: [0, MAX_DRAG],
    extrapolate: "clamp",
  });

  return (
    <View ref={containerRef} style={[s.wrapper, style as any]}>
      {/* Indicator slides in from above */}
      <Animated.View style={[s.indicator, { transform: [{ translateY: indicatorY }] }]}>
        <ActivityIndicator size="small" color={tintColor} animating={refreshing || isPrimed} />
      </Animated.View>

      {/* Content translates down as the user pulls */}
      <Animated.View style={[s.content, { transform: [{ translateY: contentY }] }]}>
        <ScrollView
          {...rest}
          style={s.fill}
          onScroll={handleScroll}
          scrollEventThrottle={16}
        >
          {children}
        </ScrollView>
      </Animated.View>
    </View>
  );
}

// ─── Native: plain ScrollView + RefreshControl ───────────────────────────────
export default function ScrollViewRefresh({
  refreshing, onRefresh, tintColor = "#007AFF", children, ...rest
}: Props) {
  if (Platform.OS !== "web") {
    return (
      <ScrollView
        {...rest}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={tintColor}
            colors={[tintColor]}
          />
        }
      >
        {children}
      </ScrollView>
    );
  }
  return (
    <WebPullToRefresh
      refreshing={refreshing}
      onRefresh={onRefresh}
      tintColor={tintColor}
      {...rest}
    >
      {children}
    </WebPullToRefresh>
  );
}

const s = StyleSheet.create({
  wrapper:   { flex: 1, overflow: "hidden" as any },
  indicator: {
    position: "absolute", top: 0, left: 0, right: 0,
    height: INDICATOR_H, alignItems: "center", justifyContent: "center", zIndex: 1,
  },
  content: { flex: 1 },
  fill:    { flex: 1 },
});
