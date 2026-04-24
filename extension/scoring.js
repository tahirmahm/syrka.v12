/**
 * Syrka Job Scoring Logic
 * Inspired by career-ops A-F scoring system.
 *
 * Criteria:
 * 1. Salary vs Market (25%)
 * 2. Skill Match % (35%)
 * 3. Seniority Fit (15%)
 * 4. Company Size Preference (15%)
 * 5. Remote/Onsite Preference (10%)
 */

function calculateScore(jobData, userPreferences) {
  let score = 0;

  // 1. Salary vs Market (25%)
  if (jobData.salary && userPreferences.expectedSalary) {
    const ratio = jobData.salary / userPreferences.expectedSalary;
    if (ratio >= 1.2) score += 25;
    else if (ratio >= 1.0) score += 20;
    else if (ratio >= 0.8) score += 15;
    else score += 5;
  } else {
    score += 15; // Neutral if salary not present
  }

  // 2. Skill Match % (35%)
  if (jobData.skills && userPreferences.skills) {
    const matchingSkills = jobData.skills.filter(skill =>
      userPreferences.skills.some(userSkill =>
        userSkill.toLowerCase().includes(skill.toLowerCase()) ||
        skill.toLowerCase().includes(userSkill.toLowerCase())
      )
    );
    const matchPercent = (matchingSkills.length / jobData.skills.length) * 100;
    score += (matchPercent * 0.35);
  } else {
    score += 20; // Neutral
  }

  // 3. Seniority Fit (15%)
  if (jobData.seniority && userPreferences.targetSeniority) {
    if (jobData.seniority.toLowerCase() === userPreferences.targetSeniority.toLowerCase()) {
      score += 15;
    } else {
      score += 5;
    }
  } else {
    score += 10; // Neutral
  }

  // 4. Company Size Preference (15%)
  if (jobData.companySize && userPreferences.preferredCompanySize) {
    if (jobData.companySize.toLowerCase() === userPreferences.preferredCompanySize.toLowerCase()) {
      score += 15;
    } else {
      score += 5;
    }
  } else {
    score += 10; // Neutral
  }

  // 5. Remote/Onsite Preference (10%)
  if (jobData.workType && userPreferences.preferredWorkType) {
    if (jobData.workType.toLowerCase() === userPreferences.preferredWorkType.toLowerCase()) {
      score += 10;
    } else {
      score += 5;
    }
  } else {
    score += 7; // Neutral
  }

  return score;
}

function getGrade(score) {
  if (score >= 90) return 'A';
  if (score >= 80) return 'B';
  if (score >= 70) return 'C';
  if (score >= 60) return 'D';
  if (score >= 50) return 'E';
  return 'F';
}

// Export for use in extension
if (typeof module !== 'undefined') {
  module.exports = { calculateScore, getGrade };
}
