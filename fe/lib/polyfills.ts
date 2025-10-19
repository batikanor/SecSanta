/**
 * Browser polyfills for packages that expect Node.js globals
 */

// Polyfill global for browser environment
if (typeof window !== 'undefined' && typeof (window as any).global === 'undefined') {
  (window as any).global = window;
}

// Ensure Buffer is available
if (typeof window !== 'undefined' && typeof (window as any).Buffer === 'undefined') {
  try {
    const { Buffer } = require('buffer');
    (window as any).Buffer = Buffer;
  } catch (e) {
    // Buffer not available, will be handled by webpack
  }
}

// Ensure process is available
if (typeof window !== 'undefined' && typeof (window as any).process === 'undefined') {
  (window as any).process = {
    env: {},
    browser: true,
    version: '',
    versions: {},
  };
}

export {};

