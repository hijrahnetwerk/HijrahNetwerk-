/**
 * Vercel Speed Insights initialization for Hijrah Netwerk
 * Automatically tracks web vitals and performance metrics
 */
import { injectSpeedInsights } from './speed-insights.mjs';

// Initialize Speed Insights when the page loads
if (typeof window !== 'undefined') {
  injectSpeedInsights({
    debug: false // Set to true for development debugging
  });
}
