/**
 * Vercel Web Analytics initialization for Hijrah Netwerk
 * Automatically tracks page views and user interactions
 */
import { inject } from './analytics.mjs';

// Initialize Web Analytics when the page loads
if (typeof window !== 'undefined') {
  inject({
    mode: 'auto', // Automatically detects development vs production
    debug: false  // Set to true for development debugging
  });
}
