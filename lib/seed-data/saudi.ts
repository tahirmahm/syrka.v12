export const saudiSeedData = {
  vision: {
    country: "Saudi Arabia",
    slug: "saudi",
    vision_name: "Saudi Vision 2030",
    target_year: 2030,
    accent_color: "#C9A84C",
    description: "Kingdom of Saudi Arabia's transformational programme to diversify the economy away from oil dependency, achieving 70% private sector GDP contribution and creating one million new jobs in priority sectors."
  },
  sectors: [
    {
      name: "Technology & Digital Infrastructure",
      current_workforce: 142000,
      target_workforce: 480000,
      current_year: 2024,
      target_year: 2030,
      priority_score: 10,
      icon: "cpu",
      description: "Software, AI, cloud, cybersecurity, smart cities"
    },
    {
      name: "Tourism & Hospitality",
      current_workforce: 280000,
      target_workforce: 1200000,
      current_year: 2024,
      target_year: 2030,
      priority_score: 10,
      icon: "map-pin",
      description: "Hospitality management, tourism operations, heritage, entertainment"
    },
    {
      name: "Financial Services & Fintech",
      current_workforce: 98000,
      target_workforce: 280000,
      current_year: 2024,
      target_year: 2030,
      priority_score: 9,
      icon: "trending-up",
      description: "Banking, Islamic finance, fintech, capital markets"
    },
    {
      name: "Healthcare & Life Sciences",
      current_workforce: 184000,
      target_workforce: 420000,
      current_year: 2024,
      target_year: 2030,
      priority_score: 9,
      icon: "heart",
      description: "Clinical, pharmaceutical, health technology, research"
    },
    {
      name: "Manufacturing & Industry 4.0",
      current_workforce: 220000,
      target_workforce: 580000,
      current_year: 2024,
      target_year: 2030,
      priority_score: 8,
      icon: "settings",
      description: "Advanced manufacturing, robotics, automation, mining technology"
    },
    {
      name: "Renewable Energy & Environment",
      current_workforce: 28000,
      target_workforce: 180000,
      current_year: 2024,
      target_year: 2030,
      priority_score: 9,
      icon: "sun",
      description: "Solar, wind, hydrogen, environmental management, NEOM sectors"
    }
  ],
  skills: [
    { name: "AI & Machine Learning Engineering", category: "Technical", sector: "Technology & Digital Infrastructure", current_supply: 8200, projected_demand: 62000, annual_growth_rate: 28.4, gap_score: 95, criticality: "critical" as const },
    { name: "Cybersecurity Operations", category: "Technical", sector: "Technology & Digital Infrastructure", current_supply: 11400, projected_demand: 58000, annual_growth_rate: 24.1, gap_score: 92, criticality: "critical" as const },
    { name: "Cloud & DevOps Engineering", category: "Technical", sector: "Technology & Digital Infrastructure", current_supply: 18600, projected_demand: 72000, annual_growth_rate: 21.8, gap_score: 88, criticality: "critical" as const },
    { name: "Smart City Systems", category: "Technical", sector: "Technology & Digital Infrastructure", current_supply: 4100, projected_demand: 38000, annual_growth_rate: 32.1, gap_score: 96, criticality: "critical" as const },
    { name: "Hospitality Management", category: "Operations", sector: "Tourism & Hospitality", current_supply: 42000, projected_demand: 280000, annual_growth_rate: 18.6, gap_score: 85, criticality: "critical" as const },
    { name: "Tourism Technology", category: "Technical", sector: "Tourism & Hospitality", current_supply: 8800, projected_demand: 94000, annual_growth_rate: 22.4, gap_score: 91, criticality: "critical" as const },
    { name: "Heritage & Cultural Management", category: "Specialist", sector: "Tourism & Hospitality", current_supply: 3200, projected_demand: 42000, annual_growth_rate: 19.8, gap_score: 92, criticality: "critical" as const },
    { name: "Islamic Finance & Sharia Compliance", category: "Specialist", sector: "Financial Services & Fintech", current_supply: 18400, projected_demand: 54000, annual_growth_rate: 14.2, gap_score: 66, criticality: "high" as const },
    { name: "Fintech Development", category: "Technical", sector: "Financial Services & Fintech", current_supply: 6200, projected_demand: 48000, annual_growth_rate: 26.4, gap_score: 93, criticality: "critical" as const },
    { name: "Health Informatics & Digital Health", category: "Technical", sector: "Healthcare & Life Sciences", current_supply: 4800, projected_demand: 52000, annual_growth_rate: 24.8, gap_score: 91, criticality: "critical" as const },
    { name: "Clinical Research", category: "Specialist", sector: "Healthcare & Life Sciences", current_supply: 2100, projected_demand: 28000, annual_growth_rate: 19.2, gap_score: 93, criticality: "critical" as const },
    { name: "Industrial Robotics & Automation", category: "Technical", sector: "Manufacturing & Industry 4.0", current_supply: 12400, projected_demand: 86000, annual_growth_rate: 22.1, gap_score: 86, criticality: "critical" as const },
    { name: "Solar Energy Engineering", category: "Technical", sector: "Renewable Energy & Environment", current_supply: 3800, projected_demand: 42000, annual_growth_rate: 28.6, gap_score: 91, criticality: "critical" as const },
    { name: "Hydrogen Economy Specialist", category: "Specialist", sector: "Renewable Energy & Environment", current_supply: 420, projected_demand: 18000, annual_growth_rate: 34.2, gap_score: 98, criticality: "critical" as const }
  ],
  institutions: [
    {
      name: "King Abdullah University of Science and Technology (KAUST)",
      type: "university" as const,
      student_count: 4200,
      annual_graduate_count: 980,
      location: "Thuwal, Makkah Province",
      established_year: 2009,
      national_ranking: 1
    },
    {
      name: "King Fahd University of Petroleum and Minerals (KFUPM)",
      type: "university" as const,
      student_count: 9800,
      annual_graduate_count: 2400,
      location: "Dhahran, Eastern Province",
      established_year: 1963,
      national_ranking: 2
    },
    {
      name: "King Abdulaziz University",
      type: "university" as const,
      student_count: 82000,
      annual_graduate_count: 18000,
      location: "Jeddah",
      established_year: 1967,
      national_ranking: 3
    },
    {
      name: "Princess Nourah bint Abdulrahman University",
      type: "university" as const,
      student_count: 54000,
      annual_graduate_count: 12000,
      location: "Riyadh",
      established_year: 1970,
      national_ranking: 4
    },
    {
      name: "Technical and Vocational Training Corporation (TVTC)",
      type: "vocational" as const,
      student_count: 280000,
      annual_graduate_count: 68000,
      location: "National (220+ campuses)",
      established_year: 1980,
      national_ranking: 1
    }
  ],
  employers: [
    { name: "Saudi Aramco", sector: "Renewable Energy & Environment", size: "multinational" as const, open_roles: 2800, graduate_satisfaction_score: 8.8, avg_time_to_fill_days: 94, is_vision_partner: true },
    { name: "NEOM Company", sector: "Technology & Digital Infrastructure", size: "enterprise" as const, open_roles: 4200, graduate_satisfaction_score: 8.2, avg_time_to_fill_days: 68, is_vision_partner: true },
    { name: "Saudi National Bank", sector: "Financial Services & Fintech", size: "large" as const, open_roles: 820, graduate_satisfaction_score: 7.6, avg_time_to_fill_days: 52, is_vision_partner: true },
    { name: "stc (Saudi Telecom)", sector: "Technology & Digital Infrastructure", size: "large" as const, open_roles: 1240, graduate_satisfaction_score: 7.9, avg_time_to_fill_days: 61, is_vision_partner: true },
    { name: "Red Sea Global", sector: "Tourism & Hospitality", size: "enterprise" as const, open_roles: 3600, graduate_satisfaction_score: 7.4, avg_time_to_fill_days: 78, is_vision_partner: true },
    { name: "Saudi German Hospital Group", sector: "Healthcare & Life Sciences", size: "large" as const, open_roles: 680, graduate_satisfaction_score: 7.2, avg_time_to_fill_days: 85, is_vision_partner: false },
    { name: "Ma'aden (Mining)", sector: "Manufacturing & Industry 4.0", size: "large" as const, open_roles: 940, graduate_satisfaction_score: 7.8, avg_time_to_fill_days: 72, is_vision_partner: true },
    { name: "STC Pay (Fintech)", sector: "Financial Services & Fintech", size: "sme" as const, open_roles: 280, graduate_satisfaction_score: 8.6, avg_time_to_fill_days: 34, is_vision_partner: false }
  ],
  trajectoryPoints: [
    // Technology
    { sector: "Technology & Digital Infrastructure", year: 2020, current_trajectory: 82000, vision_target: 180000, with_intervention: 82000, data_type: "historical" as const },
    { sector: "Technology & Digital Infrastructure", year: 2022, current_trajectory: 112000, vision_target: 280000, with_intervention: 112000, data_type: "historical" as const },
    { sector: "Technology & Digital Infrastructure", year: 2024, current_trajectory: 142000, vision_target: 340000, with_intervention: 142000, data_type: "historical" as const },
    { sector: "Technology & Digital Infrastructure", year: 2026, current_trajectory: 195000, vision_target: 400000, with_intervention: 260000, data_type: "projected" as const },
    { sector: "Technology & Digital Infrastructure", year: 2028, current_trajectory: 260000, vision_target: 440000, with_intervention: 380000, data_type: "projected" as const },
    { sector: "Technology & Digital Infrastructure", year: 2030, current_trajectory: 320000, vision_target: 480000, with_intervention: 470000, data_type: "projected" as const },
    // Tourism
    { sector: "Tourism & Hospitality", year: 2020, current_trajectory: 180000, vision_target: 400000, with_intervention: 180000, data_type: "historical" as const },
    { sector: "Tourism & Hospitality", year: 2022, current_trajectory: 220000, vision_target: 600000, with_intervention: 220000, data_type: "historical" as const },
    { sector: "Tourism & Hospitality", year: 2024, current_trajectory: 280000, vision_target: 800000, with_intervention: 280000, data_type: "historical" as const },
    { sector: "Tourism & Hospitality", year: 2026, current_trajectory: 380000, vision_target: 950000, with_intervention: 520000, data_type: "projected" as const },
    { sector: "Tourism & Hospitality", year: 2028, current_trajectory: 500000, vision_target: 1100000, with_intervention: 820000, data_type: "projected" as const },
    { sector: "Tourism & Hospitality", year: 2030, current_trajectory: 620000, vision_target: 1200000, with_intervention: 1050000, data_type: "projected" as const },
    // Financial
    { sector: "Financial Services & Fintech", year: 2020, current_trajectory: 68000, vision_target: 120000, with_intervention: 68000, data_type: "historical" as const },
    { sector: "Financial Services & Fintech", year: 2022, current_trajectory: 82000, vision_target: 180000, with_intervention: 82000, data_type: "historical" as const },
    { sector: "Financial Services & Fintech", year: 2024, current_trajectory: 98000, vision_target: 220000, with_intervention: 98000, data_type: "historical" as const },
    { sector: "Financial Services & Fintech", year: 2026, current_trajectory: 130000, vision_target: 245000, with_intervention: 165000, data_type: "projected" as const },
    { sector: "Financial Services & Fintech", year: 2028, current_trajectory: 170000, vision_target: 265000, with_intervention: 230000, data_type: "projected" as const },
    { sector: "Financial Services & Fintech", year: 2030, current_trajectory: 200000, vision_target: 280000, with_intervention: 270000, data_type: "projected" as const },
    // Healthcare
    { sector: "Healthcare & Life Sciences", year: 2020, current_trajectory: 140000, vision_target: 220000, with_intervention: 140000, data_type: "historical" as const },
    { sector: "Healthcare & Life Sciences", year: 2022, current_trajectory: 162000, vision_target: 300000, with_intervention: 162000, data_type: "historical" as const },
    { sector: "Healthcare & Life Sciences", year: 2024, current_trajectory: 184000, vision_target: 350000, with_intervention: 184000, data_type: "historical" as const },
    { sector: "Healthcare & Life Sciences", year: 2026, current_trajectory: 220000, vision_target: 380000, with_intervention: 280000, data_type: "projected" as const },
    { sector: "Healthcare & Life Sciences", year: 2028, current_trajectory: 260000, vision_target: 400000, with_intervention: 360000, data_type: "projected" as const },
    { sector: "Healthcare & Life Sciences", year: 2030, current_trajectory: 300000, vision_target: 420000, with_intervention: 410000, data_type: "projected" as const },
    // Manufacturing
    { sector: "Manufacturing & Industry 4.0", year: 2020, current_trajectory: 160000, vision_target: 280000, with_intervention: 160000, data_type: "historical" as const },
    { sector: "Manufacturing & Industry 4.0", year: 2022, current_trajectory: 190000, vision_target: 380000, with_intervention: 190000, data_type: "historical" as const },
    { sector: "Manufacturing & Industry 4.0", year: 2024, current_trajectory: 220000, vision_target: 440000, with_intervention: 220000, data_type: "historical" as const },
    { sector: "Manufacturing & Industry 4.0", year: 2026, current_trajectory: 280000, vision_target: 500000, with_intervention: 340000, data_type: "projected" as const },
    { sector: "Manufacturing & Industry 4.0", year: 2028, current_trajectory: 350000, vision_target: 550000, with_intervention: 460000, data_type: "projected" as const },
    { sector: "Manufacturing & Industry 4.0", year: 2030, current_trajectory: 400000, vision_target: 580000, with_intervention: 560000, data_type: "projected" as const },
    // Renewable Energy
    { sector: "Renewable Energy & Environment", year: 2020, current_trajectory: 12000, vision_target: 60000, with_intervention: 12000, data_type: "historical" as const },
    { sector: "Renewable Energy & Environment", year: 2022, current_trajectory: 19000, vision_target: 100000, with_intervention: 19000, data_type: "historical" as const },
    { sector: "Renewable Energy & Environment", year: 2024, current_trajectory: 28000, vision_target: 130000, with_intervention: 28000, data_type: "historical" as const },
    { sector: "Renewable Energy & Environment", year: 2026, current_trajectory: 52000, vision_target: 150000, with_intervention: 82000, data_type: "projected" as const },
    { sector: "Renewable Energy & Environment", year: 2028, current_trajectory: 80000, vision_target: 168000, with_intervention: 140000, data_type: "projected" as const },
    { sector: "Renewable Energy & Environment", year: 2030, current_trajectory: 105000, vision_target: 180000, with_intervention: 175000, data_type: "projected" as const },
  ]
}
