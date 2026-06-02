import { useEffect } from 'react';
import posthog from 'posthog-js';

// We initialize here outside component so it runs once
const POSTHOG_KEY = import.meta.env.VITE_POSTHOG_KEY || '';
const POSTHOG_HOST = import.meta.env.VITE_POSTHOG_HOST || 'https://us.i.posthog.com';

if (POSTHOG_KEY && typeof window !== 'undefined') {
  posthog.init(POSTHOG_KEY, {
    api_host: POSTHOG_HOST,
    autocapture: true,
    capture_pageview: true,
    capture_pageleave: true,
  });
}

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  // Auto pageviews are handled by posthog natively
  // But if needed, we could use wouter's useLocation hook here to trigger manual capture
  
  return <>{children}</>;
}
