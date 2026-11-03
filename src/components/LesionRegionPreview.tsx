import React, { useEffect, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  Animated,
  Easing,
  Image,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type {
  CroppedImage,
  NormalizedCrop,
} from '../services/imageProcessingService';
import { Colors } from '../theme';

type Props = {
  original: CroppedImage;
  selected: CroppedImage;
  bounds?: NormalizedCrop;
  cropped: boolean;
  size: number;
  mode: 'crop' | 'highlight';
  animate?: boolean;
  onComplete?: () => void;
  onError?: () => void;
};

export function validLesionBounds(
  bounds?: NormalizedCrop,
): bounds is NormalizedCrop {
  return (
    !!bounds &&
    [bounds.left, bounds.top, bounds.right, bounds.bottom].every(
      Number.isFinite,
    ) &&
    bounds.left >= 0 &&
    bounds.top >= 0 &&
    bounds.right <= 1 &&
    bounds.bottom <= 1 &&
    bounds.right > bounds.left &&
    bounds.bottom > bounds.top
  );
}

/** Animate actual model bounds, then reveal the already validated crop. */
export function LesionRegionPreview({
  original,
  selected,
  bounds,
  cropped,
  size,
  mode,
  animate = true,
  onComplete,
  onError,
}: Props) {
  const hasRegion = validLesionBounds(bounds);
  const [intro, setIntro] = useState(animate && cropped && hasRegion);
  const completion = useRef(onComplete);
  completion.current = onComplete;
  const completed = useRef(false);
  const failed = useRef(false);
  const [motionAllowed, setMotionAllowed] = useState(false);
  const [originalLoaded, setOriginalLoaded] = useState(false);
  const [cropLoaded, setCropLoaded] = useState(false);
  const outline = useRef(new Animated.Value(0)).current;
  const cropFade = useRef(new Animated.Value(0)).current;
  const previousMode = useRef(mode);
  useEffect(() => {
    if (!intro && cropLoaded && !failed.current && !completed.current) {
      completed.current = true;
      completion.current?.();
    }
  }, [intro, cropLoaded]);
  const imageFailed = () => {
    failed.current = true;
    setIntro(false);
    onError?.();
  };
  useEffect(() => {
    let active = true;
    AccessibilityInfo.isReduceMotionEnabled()
      .then(reduced => {
        if (!active) return;
        if (reduced) setIntro(false);
        else setMotionAllowed(true);
      })
      .catch(() => {
        if (active) setIntro(false);
      });
    const change = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      reduced => {
        if (reduced) {
          setIntro(false);
          setMotionAllowed(false);
        }
      },
    );
    return () => {
      active = false;
      change.remove();
    };
  }, []);
  useEffect(() => {
    if (previousMode.current !== mode) setIntro(false);
    previousMode.current = mode;
  }, [mode]);
  useEffect(() => {
    if (!intro || !motionAllowed || !originalLoaded || !cropLoaded) return;
    const animation = Animated.sequence([
      Animated.timing(outline, {
        toValue: 1,
        duration: 350,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
        isInteraction: false,
      }),
      Animated.delay(650),
      Animated.timing(cropFade, {
        toValue: 1,
        duration: 650,
        easing: Easing.inOut(Easing.cubic),
        useNativeDriver: true,
        isInteraction: false,
      }),
    ]);
    animation.start(({ finished }) => {
      if (finished) setIntro(false);
    });
    return () => animation.stop();
  }, [intro, motionAllowed, originalLoaded, cropLoaded, outline, cropFade]);

  const fit = Math.min(size / original.width, size / original.height);
  const width = original.width * fit;
  const height = original.height * fit;
  const showOriginal = intro || mode === 'highlight';
  const outlineOpacity = intro ? outline : 1;
  return (
    <View style={{ width: size, height: size }}>
      <Image
        source={{ uri: showOriginal ? original.uri : selected.uri }}
        style={styles.image}
        resizeMode="contain"
        onLoad={() => {
          setOriginalLoaded(true);
          if (!intro) setCropLoaded(true);
        }}
        onError={imageFailed}
      />
      {showOriginal && hasRegion && (
        <Animated.View
          testID="lesion-region-outline"
          pointerEvents="none"
          style={[
            styles.outline,
            {
              left: (size - width) / 2 + bounds.left * width,
              top: (size - height) / 2 + bounds.top * height,
              width: (bounds.right - bounds.left) * width,
              height: (bounds.bottom - bounds.top) * height,
              opacity: outlineOpacity,
            },
          ]}
        />
      )}
      {intro && (
        <Animated.View
          pointerEvents="none"
          style={[styles.crop, { opacity: cropFade }]}
        >
          <Image
            source={{ uri: selected.uri }}
            style={styles.image}
            resizeMode="contain"
            onLoad={() => setCropLoaded(true)}
            onError={imageFailed}
          />
        </Animated.View>
      )}
      {intro && originalLoaded && cropLoaded && (
        <View pointerEvents="none" style={styles.badge}>
          <Text style={styles.badgeText}>Highlighting selected region…</Text>
        </View>
      )}
    </View>
  );
}
const styles = StyleSheet.create({
  image: { width: '100%', height: '100%' },
  outline: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: Colors.accent,
    backgroundColor: 'rgba(0,201,177,0.15)',
    borderRadius: 8,
  },
  crop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: Colors.surfaceAlt,
  },
  badge: {
    position: 'absolute',
    bottom: 12,
    alignSelf: 'center',
    backgroundColor: Colors.primaryDark,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  badgeText: { color: Colors.white, fontSize: 12 },
});
