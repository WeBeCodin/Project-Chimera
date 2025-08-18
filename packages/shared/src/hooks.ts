import { useState, useEffect, useCallback } from 'react';
import type { Job } from './types';

/**
 * Hook for polling job status
 */
export function useJobPolling(jobId: string | null, interval: number = 5000) {
  const [job, setJob] = useState<Job | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchJobStatus = useCallback(async () => {
    if (!jobId) return;

    try {
      setIsLoading(true);
      const response = await fetch(`/api/jobs/${jobId}/status`);
      const data = await response.json();

      if (response.ok) {
        setJob(data);
        setError(null);
      } else {
        setError(data.error || 'Failed to fetch job status');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  }, [jobId]);

  useEffect(() => {
    if (!jobId) return;

    fetchJobStatus();
    
    const intervalId = setInterval(() => {
      fetchJobStatus();
    }, interval);

    return () => clearInterval(intervalId);
  }, [jobId, interval, fetchJobStatus]);

  return { job, isLoading, error, refetch: fetchJobStatus };
}

/**
 * Hook for managing local storage state
 */
export function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      if (typeof window !== 'undefined') {
        const item = window.localStorage.getItem(key);
        return item ? JSON.parse(item) : initialValue;
      }
      return initialValue;
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  const setValue = useCallback((value: T) => {
    try {
      setStoredValue(value);
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, JSON.stringify(value));
      }
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  }, [key]);

  return [storedValue, setValue];
}

/**
 * Hook for async operations with loading and error states
 */
export function useAsync<T>() {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const execute = useCallback(async (asyncFunction: () => Promise<T>) => {
    try {
      setIsLoading(true);
      setError(null);
      const result = await asyncFunction();
      setData(result);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { data, isLoading, error, execute };
}