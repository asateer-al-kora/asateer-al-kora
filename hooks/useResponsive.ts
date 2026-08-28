import { useState, useEffect } from 'react';
import { Dimensions, Platform } from 'react-native';

export type Breakpoint = 'mobile' | 'tablet' | 'laptop' | 'desktop' | 'large';

const BREAKPOINTS: Record<Breakpoint, number> = {
  mobile: 0,
  tablet: 768,
  laptop: 1024,
  desktop: 1280,
  large: 1536,
};

function getBreakpoint(width: number): Breakpoint {
  if (width >= BREAKPOINTS.large) return 'large';
  if (width >= BREAKPOINTS.desktop) return 'desktop';
  if (width >= BREAKPOINTS.laptop) return 'laptop';
  if (width >= BREAKPOINTS.tablet) return 'tablet';
  return 'mobile';
}

export function useResponsive() {
  const [windowWidth, setWindowWidth] = useState(
    Platform.OS === 'web' && typeof window !== 'undefined' ? window.innerWidth : Dimensions.get('window').width
  );

  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const handler = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  const breakpoint = getBreakpoint(windowWidth);

  return {
    breakpoint,
    windowWidth,
    isMobile: breakpoint === 'mobile',
    isTablet: breakpoint === 'tablet',
    isLaptop: breakpoint === 'laptop',
    isDesktop: breakpoint === 'desktop' || breakpoint === 'large',
    isLarge: breakpoint === 'large',
    isTabletUp: windowWidth >= BREAKPOINTS.tablet,
    isLaptopUp: windowWidth >= BREAKPOINTS.laptop,
    isDesktopUp: windowWidth >= BREAKPOINTS.desktop,
  };
}

export const maxWidths = {
  mobile: '100%',
  tablet: 720,
  laptop: 960,
  desktop: 1100,
  large: 1280,
  content: 1200,
  sidebar: 240,
};

export function getContentMaxWidth(breakpoint: Breakpoint): number {
  switch (breakpoint) {
    case 'large': return maxWidths.large;
    case 'desktop': return maxWidths.desktop;
    case 'laptop': return maxWidths.laptop;
    case 'tablet': return maxWidths.tablet;
    default: return 0;
  }
}

export function getGridColumns(breakpoint: Breakpoint, type: 'matches' | 'news' | 'leagues' | 'players' = 'matches'): number {
  if (type === 'matches') {
    switch (breakpoint) {
      case 'large': return 3;
      case 'desktop': return 3;
      case 'laptop': return 2;
      case 'tablet': return 2;
      default: return 1;
    }
  }
  if (type === 'news') {
    switch (breakpoint) {
      case 'large': return 4;
      case 'desktop': return 3;
      case 'laptop': return 2;
      case 'tablet': return 2;
      default: return 1;
    }
  }
  if (type === 'leagues') {
    switch (breakpoint) {
      case 'large': return 3;
      case 'desktop': return 2;
      case 'laptop': return 2;
      case 'tablet': return 2;
      default: return 1;
    }
  }
  if (type === 'players') {
    switch (breakpoint) {
      case 'large': return 6;
      case 'desktop': return 5;
      case 'laptop': return 4;
      case 'tablet': return 3;
      default: return 2;
    }
  }
  return 1;
}
