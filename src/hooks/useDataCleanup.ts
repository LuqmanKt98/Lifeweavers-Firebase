// src/hooks/useDataCleanup.ts
"use client";

import { useEffect } from 'react';
import { cleanupOrphanedData } from '@/lib/firebase/clients';

/**
 * Hook to automatically clean up orphaned data
 * This ensures data consistency by removing records that reference deleted clients
 */
export const useDataCleanup = (enabled: boolean = true) => {
  useEffect(() => {
    if (!enabled) return;

    const performCleanup = async () => {
      try {
        const cleanupResult = await cleanupOrphanedData();
        const totalCleaned = cleanupResult.deletedSessions + cleanupResult.deletedAppointments + cleanupResult.deletedTasks + cleanupResult.deletedReports;
        
        if (totalCleaned > 0) {
          console.log('🧹 Background cleanup completed:', {
            sessions: cleanupResult.deletedSessions,
            appointments: cleanupResult.deletedAppointments,
            tasks: cleanupResult.deletedTasks,
            reports: cleanupResult.deletedReports,
            total: totalCleaned
          });
        }
      } catch (error) {
        console.warn('Background cleanup failed:', error);
      }
    };

    // Run cleanup after a short delay to avoid blocking initial load
    const timeoutId = setTimeout(performCleanup, 2000);

    return () => clearTimeout(timeoutId);
  }, [enabled]);
};
