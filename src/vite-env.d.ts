/// <reference types="vite/client" />

declare global {
  // Build-time constants injected by Vite
  const __COMMIT_HASH__: string;
  const __BUILD_TIME__: string;
  const __BUILD_VERSION__: string;
  const __NODE_ENV__: string;

  // Google Analytics gtag function declaration
  interface Window {
    gtag: (...args: unknown[]) => void;
    dataLayer: unknown[];
  }
}

export {};
