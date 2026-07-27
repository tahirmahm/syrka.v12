export const ukSeedData = {
  vision: {
    country: "United Kingdom",
    slug: "uk",
    vision_name: "AI Opportunities Action Plan",
    target_year: 2030,
    accent_color: "#1a3a6b",
    description: "Britain's commitment to upskill 10 million workers in AI by 2030, unlocking up to £140 billion in annual economic output. 97% of UK organisations report at least one AI skills gap."
  },
  sectors: [
    {
      name: "AI and Machine Learning",
      current_workforce: 700000,
      target_workforce: 3500000,
      current_year: 2024,
      target_year: 2030,
      priority_score: 10,
      icon: "cpu",
      description: "Machine learning engineering, AI product management, research science, MLOps"
    },
    {
      name: "Cybersecurity",
      current_workforce: 300000,
      target_workforce: 1500000,
      current_year: 2024,
      target_year: 2030,
      priority_score: 9,
      icon: "shield",
      description: "Threat analysis, penetration testing, incident response, security architecture"
    },
    {
      name: "Cloud and Infrastructure",
      current_workforce: 220000,
      target_workforce: 1200000,
      current_year: 2024,
      target_year: 2030,
      priority_score: 9,
      icon: "cloud",
      description: "Cloud architecture, DevOps, platform engineering, cost optimisation"
    },
    {
      name: "Data Science and Analytics",
      current_workforce: 400000,
      target_workforce: 1800000,
      current_year: 2024,
      target_year: 2030,
      priority_score: 9,
      icon: "bar-chart",
      description: "Statistical analysis, data visualisation, business intelligence, ML applications"
    },
    {
      name: "Digital Foundations",
      current_workforce: 2500000,
      target_workforce: 10000000,
      current_year: 2024,
      target_year: 2030,
      priority_score: 8,
      icon: "monitor",
      description: "Digital literacy, AI awareness, basic programming, data handling across all sectors"
    },
    {
      name: "Health and Public Sector AI",
      current_workforce: 180000,
      target_workforce: 800000,
      current_year: 2024,
      target_year: 2030,
      priority_score: 8,
      icon: "heart",
      description: "Health informatics, NHS digital transformation, public service AI, clinical data science"
    }
  ],
  skills: [
    { name: "Machine Learning Engineering", category: "Technical", sector: "AI and Machine Learning", current_supply: 42000, projected_demand: 380000, annual_growth_rate: 28.4, gap_score: 95, criticality: "critical" as const },
    { name: "Natural Language Processing", category: "Technical", sector: "AI and Machine Learning", current_supply: 18000, projected_demand: 160000, annual_growth_rate: 32.1, gap_score: 93, criticality: "critical" as const },
    { name: "MLOps & AI Deployment", category: "Technical", sector: "AI and Machine Learning", current_supply: 28000, projected_demand: 240000, annual_growth_rate: 26.8, gap_score: 91, criticality: "critical" as const },
    { name: "AI Product Management", category: "Strategic", sector: "AI and Machine Learning", current_supply: 12000, projected_demand: 120000, annual_growth_rate: 24.2, gap_score: 88, criticality: "high" as const },
    { name: "Network Security", category: "Technical", sector: "Cybersecurity", current_supply: 48000, projected_demand: 280000, annual_growth_rate: 18.6, gap_score: 86, criticality: "critical" as const },
    { name: "Penetration Testing", category: "Technical", sector: "Cybersecurity", current_supply: 22000, projected_demand: 180000, annual_growth_rate: 22.4, gap_score: 90, criticality: "critical" as const },
    { name: "Incident Response", category: "Operations", sector: "Cybersecurity", current_supply: 31000, projected_demand: 220000, annual_growth_rate: 20.1, gap_score: 87, criticality: "high" as const },
    { name: "Cloud Architecture", category: "Technical", sector: "Cloud and Infrastructure", current_supply: 38000, projected_demand: 320000, annual_growth_rate: 24.8, gap_score: 92, criticality: "critical" as const },
    { name: "DevOps Engineering", category: "Technical", sector: "Cloud and Infrastructure", current_supply: 52000, projected_demand: 280000, annual_growth_rate: 19.4, gap_score: 82, criticality: "high" as const },
    { name: "Data Visualisation", category: "Analytical", sector: "Data Science and Analytics", current_supply: 64000, projected_demand: 340000, annual_growth_rate: 16.2, gap_score: 78, criticality: "high" as const },
    { name: "Statistical Modelling", category: "Analytical", sector: "Data Science and Analytics", current_supply: 42000, projected_demand: 280000, annual_growth_rate: 21.8, gap_score: 88, criticality: "critical" as const },
    { name: "AI Literacy", category: "Foundation", sector: "Digital Foundations", current_supply: 820000, projected_demand: 6400000, annual_growth_rate: 34.2, gap_score: 85, criticality: "critical" as const },
    { name: "Health Informatics", category: "Technical", sector: "Health and Public Sector AI", current_supply: 24000, projected_demand: 160000, annual_growth_rate: 22.6, gap_score: 89, criticality: "critical" as const },
    { name: "Clinical Data Science", category: "Analytical", sector: "Health and Public Sector AI", current_supply: 8400, projected_demand: 92000, annual_growth_rate: 26.4, gap_score: 94, criticality: "critical" as const }
  ],
  institutions: [
    {
      name: "University of Oxford",
      type: "university" as const,
      student_count: 26000,
      annual_graduate_count: 6800,
      location: "Oxford",
      established_year: 1096,
      national_ranking: 1
    },
    {
      name: "Imperial College London",
      type: "university" as const,
      student_count: 22000,
      annual_graduate_count: 5400,
      location: "London",
      established_year: 1907,
      national_ranking: 2
    },
    {
      name: "University of Cambridge",
      type: "university" as const,
      student_count: 24000,
      annual_graduate_count: 6200,
      location: "Cambridge",
      established_year: 1209,
      national_ranking: 3
    },
    {
      name: "University College London",
      type: "university" as const,
      student_count: 46000,
      annual_graduate_count: 12000,
      location: "London",
      established_year: 1826,
      national_ranking: 4
    },
    {
      name: "University of Edinburgh",
      type: "university" as const,
      student_count: 36000,
      annual_graduate_count: 9200,
      location: "Edinburgh",
      established_year: 1583,
      national_ranking: 5
    },
    {
      name: "Skills England",
      type: "vocational" as const,
      student_count: 0,
      annual_graduate_count: 0,
      location: "London",
      established_year: 2024,
      national_ranking: null
    },
    {
      name: "DSIT",
      type: "vocational" as const,
      student_count: 0,
      annual_graduate_count: 0,
      location: "London",
      established_year: 2023,
      national_ranking: null
    }
  ],
  employers: [
    { name: "DeepMind", sector: "AI and Machine Learning", size: "large" as const, open_roles: 420, graduate_satisfaction_score: 9.2, avg_time_to_fill_days: 84, is_vision_partner: true },
    { name: "Wayve", sector: "AI and Machine Learning", size: "sme" as const, open_roles: 180, graduate_satisfaction_score: 8.8, avg_time_to_fill_days: 62, is_vision_partner: false },
    { name: "BAE Systems Digital Intelligence", sector: "Cybersecurity", size: "enterprise" as const, open_roles: 680, graduate_satisfaction_score: 7.8, avg_time_to_fill_days: 72, is_vision_partner: true },
    { name: "Darktrace", sector: "Cybersecurity", size: "large" as const, open_roles: 320, graduate_satisfaction_score: 8.2, avg_time_to_fill_days: 58, is_vision_partner: false },
    { name: "AWS UK", sector: "Cloud and Infrastructure", size: "multinational" as const, open_roles: 1240, graduate_satisfaction_score: 8.4, avg_time_to_fill_days: 48, is_vision_partner: true },
    { name: "Microsoft UK", sector: "Cloud and Infrastructure", size: "multinational" as const, open_roles: 980, graduate_satisfaction_score: 8.6, avg_time_to_fill_days: 52, is_vision_partner: true },
    { name: "Faculty AI", sector: "Data Science and Analytics", size: "sme" as const, open_roles: 140, graduate_satisfaction_score: 8.9, avg_time_to_fill_days: 42, is_vision_partner: true },
    { name: "Quantexa", sector: "Data Science and Analytics", size: "large" as const, open_roles: 280, graduate_satisfaction_score: 8.4, avg_time_to_fill_days: 56, is_vision_partner: false },
    { name: "NHS Digital", sector: "Health and Public Sector AI", size: "enterprise" as const, open_roles: 860, graduate_satisfaction_score: 7.4, avg_time_to_fill_days: 92, is_vision_partner: true },
    { name: "Monzo", sector: "Digital Foundations", size: "large" as const, open_roles: 220, graduate_satisfaction_score: 8.8, avg_time_to_fill_days: 38, is_vision_partner: false }
  ],
  trajectoryPoints: [
    // AI and Machine Learning
    { sector: "AI and Machine Learning", year: 2020, current_trajectory: 280000, vision_target: 800000, with_intervention: 280000, data_type: "historical" as const },
    { sector: "AI and Machine Learning", year: 2022, current_trajectory: 480000, vision_target: 1400000, with_intervention: 480000, data_type: "historical" as const },
    { sector: "AI and Machine Learning", year: 2024, current_trajectory: 700000, vision_target: 2000000, with_intervention: 700000, data_type: "historical" as const },
    { sector: "AI and Machine Learning", year: 2026, current_trajectory: 1100000, vision_target: 2600000, with_intervention: 1500000, data_type: "projected" as const },
    { sector: "AI and Machine Learning", year: 2028, current_trajectory: 1600000, vision_target: 3100000, with_intervention: 2500000, data_type: "projected" as const },
    { sector: "AI and Machine Learning", year: 2030, current_trajectory: 2100000, vision_target: 3500000, with_intervention: 3400000, data_type: "projected" as const },
    // Cybersecurity
    { sector: "Cybersecurity", year: 2020, current_trajectory: 160000, vision_target: 400000, with_intervention: 160000, data_type: "historical" as const },
    { sector: "Cybersecurity", year: 2022, current_trajectory: 220000, vision_target: 700000, with_intervention: 220000, data_type: "historical" as const },
    { sector: "Cybersecurity", year: 2024, current_trajectory: 300000, vision_target: 1000000, with_intervention: 300000, data_type: "historical" as const },
    { sector: "Cybersecurity", year: 2026, current_trajectory: 480000, vision_target: 1200000, with_intervention: 640000, data_type: "projected" as const },
    { sector: "Cybersecurity", year: 2028, current_trajectory: 680000, vision_target: 1350000, with_intervention: 1100000, data_type: "projected" as const },
    { sector: "Cybersecurity", year: 2030, current_trajectory: 880000, vision_target: 1500000, with_intervention: 1450000, data_type: "projected" as const },
    // Cloud and Infrastructure
    { sector: "Cloud and Infrastructure", year: 2020, current_trajectory: 120000, vision_target: 400000, with_intervention: 120000, data_type: "historical" as const },
    { sector: "Cloud and Infrastructure", year: 2022, current_trajectory: 160000, vision_target: 600000, with_intervention: 160000, data_type: "historical" as const },
    { sector: "Cloud and Infrastructure", year: 2024, current_trajectory: 220000, vision_target: 800000, with_intervention: 220000, data_type: "historical" as const },
    { sector: "Cloud and Infrastructure", year: 2026, current_trajectory: 380000, vision_target: 960000, with_intervention: 520000, data_type: "projected" as const },
    { sector: "Cloud and Infrastructure", year: 2028, current_trajectory: 560000, vision_target: 1100000, with_intervention: 880000, data_type: "projected" as const },
    { sector: "Cloud and Infrastructure", year: 2030, current_trajectory: 720000, vision_target: 1200000, with_intervention: 1150000, data_type: "projected" as const },
    // Data Science and Analytics
    { sector: "Data Science and Analytics", year: 2020, current_trajectory: 180000, vision_target: 600000, with_intervention: 180000, data_type: "historical" as const },
    { sector: "Data Science and Analytics", year: 2022, current_trajectory: 280000, vision_target: 1000000, with_intervention: 280000, data_type: "historical" as const },
    { sector: "Data Science and Analytics", year: 2024, current_trajectory: 400000, vision_target: 1300000, with_intervention: 400000, data_type: "historical" as const },
    { sector: "Data Science and Analytics", year: 2026, current_trajectory: 620000, vision_target: 1500000, with_intervention: 840000, data_type: "projected" as const },
    { sector: "Data Science and Analytics", year: 2028, current_trajectory: 880000, vision_target: 1680000, with_intervention: 1400000, data_type: "projected" as const },
    { sector: "Data Science and Analytics", year: 2030, current_trajectory: 1100000, vision_target: 1800000, with_intervention: 1750000, data_type: "projected" as const },
    // Digital Foundations
    { sector: "Digital Foundations", year: 2020, current_trajectory: 800000, vision_target: 3000000, with_intervention: 800000, data_type: "historical" as const },
    { sector: "Digital Foundations", year: 2022, current_trajectory: 1400000, vision_target: 5000000, with_intervention: 1400000, data_type: "historical" as const },
    { sector: "Digital Foundations", year: 2024, current_trajectory: 2500000, vision_target: 7000000, with_intervention: 2500000, data_type: "historical" as const },
    { sector: "Digital Foundations", year: 2026, current_trajectory: 4000000, vision_target: 8200000, with_intervention: 5200000, data_type: "projected" as const },
    { sector: "Digital Foundations", year: 2028, current_trajectory: 5800000, vision_target: 9200000, with_intervention: 8000000, data_type: "projected" as const },
    { sector: "Digital Foundations", year: 2030, current_trajectory: 7200000, vision_target: 10000000, with_intervention: 9800000, data_type: "projected" as const },
    // Health and Public Sector AI
    { sector: "Health and Public Sector AI", year: 2020, current_trajectory: 82000, vision_target: 240000, with_intervention: 82000, data_type: "historical" as const },
    { sector: "Health and Public Sector AI", year: 2022, current_trajectory: 120000, vision_target: 400000, with_intervention: 120000, data_type: "historical" as const },
    { sector: "Health and Public Sector AI", year: 2024, current_trajectory: 180000, vision_target: 560000, with_intervention: 180000, data_type: "historical" as const },
    { sector: "Health and Public Sector AI", year: 2026, current_trajectory: 280000, vision_target: 660000, with_intervention: 380000, data_type: "projected" as const },
    { sector: "Health and Public Sector AI", year: 2028, current_trajectory: 420000, vision_target: 740000, with_intervention: 620000, data_type: "projected" as const },
    { sector: "Health and Public Sector AI", year: 2030, current_trajectory: 540000, vision_target: 800000, with_intervention: 780000, data_type: "projected" as const },
  ]
}
