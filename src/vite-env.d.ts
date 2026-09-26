/// <reference types="vite/client" />

// Build-time constants injected by Vite
declare const __COMMIT_HASH__: string;
declare const __BUILD_TIME__: string;
declare const __BUILD_VERSION__: string;
declare const __NODE_ENV__: string;

// Google Analytics gtag function declaration
declare global {
  interface Window {
    gtag: (...args: unknown[]) => void;
    dataLayer: unknown[];
  }
}

export {};
