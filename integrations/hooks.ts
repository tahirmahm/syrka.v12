import { useState, useEffect } from 'react';
import { syrkaAdapter } from './adapter';

/**
 * Hook to get readiness score for a specific job
 */
export function useReadiness(userSkills: any, jobRequirements: any) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<any>(null);

  const fetchScore = async () => {
    setLoading(true);
    try {
      const result = await syrkaAdapter.getReadinessScore(userSkills, jobRequirements);
      setData(result);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  return { data, loading, error, fetchScore };
}

/**
 * Hook to generate a job application
 */
export function useApplicationGenerator() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<any>(null);

  const generate = async (userData: any, jobData: any) => {
    setLoading(true);
    try {
      const result = await syrkaAdapter.generateApplication(userData, jobData);
      setData(result);
      return result;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { data, loading, error, generate };
}
