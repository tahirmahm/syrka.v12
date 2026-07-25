/**
 * Syrka Backend Adapter
 * Provides a clean interface for the existing Syrka UI to communicate
 * with the new extension backend.
 */

const API_BASE_URL = 'http://localhost:3001/api';

export const syrkaAdapter = {
  async getReadinessScore(userSkills: any, jobRequirements: any) {
    const response = await fetch(`${API_BASE_URL}/readiness/score`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userSkills, jobRequirements }),
    });
    return response.json();
  },

  async generateApplication(userData: any, jobData: any) {
    const response = await fetch(`${API_BASE_URL}/applications/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userData, jobData }),
    });
    return response.json();
  },

  async extractSkills(text: string, type: 'moodle' | 'job') {
    const response = await fetch(`${API_BASE_URL}/skills/extract`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, type }),
    });
    return response.json();
  }
};
