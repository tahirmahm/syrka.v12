export const maltaSeedData = {
  vision: {
    country: "Malta",
    slug: "malta",
    vision_name: "Malta Vision 2050",
    target_year: 2050,
    accent_color: "#1B6B5A",
    description: "Malta's long-term strategy to transform into a high-value knowledge economy, achieving full employment in digital, financial, and green sectors while maintaining Mediterranean quality of life."
  },
  sectors: [
    {
      name: "Digital Economy & ICT",
      current_workforce: 18400,
      target_workforce: 52000,
      current_year: 2024,
      target_year: 2050,
      priority_score: 10,
      icon: "cpu",
      description: "Software development, cybersecurity, AI, fintech infrastructure"
    },
    {
      name: "Financial Services",
      current_workforce: 12800,
      target_workforce: 28000,
      current_year: 2024,
      target_year: 2050,
      priority_score: 9,
      icon: "trending-up",
      description: "Banking, insurance, asset management, blockchain finance"
    },
    {
      name: "Healthcare & Life Sciences",
      current_workforce: 9200,
      target_workforce: 19500,
      current_year: 2024,
      target_year: 2050,
      priority_score: 8,
      icon: "heart",
      description: "Medical professionals, health informatics, pharmaceutical research"
    },
    {
      name: "Green Economy & Energy",
      current_workforce: 3100,
      target_workforce: 14000,
      current_year: 2024,
      target_year: 2050,
      priority_score: 9,
      icon: "sun",
      description: "Renewable energy, environmental management, sustainable tourism"
    },
    {
      name: "Creative & Knowledge Industries",
      current_workforce: 6800,
      target_workforce: 18000,
      current_year: 2024,
      target_year: 2050,
      priority_score: 7,
      icon: "pen-tool",
      description: "Design, media, education technology, research"
    }
  ],
  skills: [
    { name: "Cybersecurity Engineering", category: "Technical", sector: "Digital Economy & ICT", current_supply: 820, projected_demand: 6400, annual_growth_rate: 18.2, gap_score: 87, criticality: "critical" as const },
    { name: "AI & Machine Learning", category: "Technical", sector: "Digital Economy & ICT", current_supply: 410, projected_demand: 5200, annual_growth_rate: 22.4, gap_score: 92, criticality: "critical" as const },
    { name: "Cloud Architecture", category: "Technical", sector: "Digital Economy & ICT", current_supply: 1200, projected_demand: 4800, annual_growth_rate: 14.1, gap_score: 75, criticality: "critical" as const },
    { name: "Data Engineering", category: "Technical", sector: "Digital Economy & ICT", current_supply: 680, projected_demand: 3900, annual_growth_rate: 16.8, gap_score: 83, criticality: "high" as const },
    { name: "Blockchain Development", category: "Technical", sector: "Digital Economy & ICT", current_supply: 290, projected_demand: 2100, annual_growth_rate: 19.5, gap_score: 86, criticality: "high" as const },
    { name: "Quantitative Analysis", category: "Analytical", sector: "Financial Services", current_supply: 540, projected_demand: 2800, annual_growth_rate: 11.2, gap_score: 81, criticality: "high" as const },
    { name: "RegTech & Compliance", category: "Regulatory", sector: "Financial Services", current_supply: 820, projected_demand: 3200, annual_growth_rate: 12.4, gap_score: 74, criticality: "high" as const },
    { name: "ESG Investment Analysis", category: "Analytical", sector: "Financial Services", current_supply: 180, projected_demand: 1800, annual_growth_rate: 24.1, gap_score: 90, criticality: "critical" as const },
    { name: "Health Informatics", category: "Technical", sector: "Healthcare & Life Sciences", current_supply: 310, projected_demand: 2400, annual_growth_rate: 15.6, gap_score: 87, criticality: "critical" as const },
    { name: "Clinical Data Science", category: "Analytical", sector: "Healthcare & Life Sciences", current_supply: 120, projected_demand: 1600, annual_growth_rate: 18.9, gap_score: 93, criticality: "critical" as const },
    { name: "Renewable Energy Engineering", category: "Technical", sector: "Green Economy & Energy", current_supply: 280, projected_demand: 3200, annual_growth_rate: 21.3, gap_score: 91, criticality: "critical" as const },
    { name: "Environmental Impact Assessment", category: "Regulatory", sector: "Green Economy & Energy", current_supply: 420, projected_demand: 2100, annual_growth_rate: 13.7, gap_score: 80, criticality: "high" as const }
  ],
  institutions: [
    {
      name: "University of Malta",
      type: "university" as const,
      student_count: 11500,
      annual_graduate_count: 2800,
      location: "Msida",
      established_year: 1592,
      national_ranking: 1
    },
    {
      name: "Malta College of Arts, Science and Technology (MCAST)",
      type: "polytechnic" as const,
      student_count: 8200,
      annual_graduate_count: 1900,
      location: "Paola",
      established_year: 2001,
      national_ranking: 2
    },
    {
      name: "Malta Further and Higher Education Authority (MFHEA) Partners",
      type: "vocational" as const,
      student_count: 3400,
      annual_graduate_count: 1100,
      location: "Various",
      established_year: 2012,
      national_ranking: 3
    }
  ],
  employers: [
    { name: "Bank of Valletta", sector: "Financial Services", size: "large" as const, open_roles: 48, graduate_satisfaction_score: 7.2, avg_time_to_fill_days: 68, is_vision_partner: true },
    { name: "HSBC Malta", sector: "Financial Services", size: "large" as const, open_roles: 31, graduate_satisfaction_score: 7.8, avg_time_to_fill_days: 54, is_vision_partner: true },
    { name: "GO plc (Telecom)", sector: "Digital Economy & ICT", size: "large" as const, open_roles: 62, graduate_satisfaction_score: 6.9, avg_time_to_fill_days: 82, is_vision_partner: true },
    { name: "Datatrak International", sector: "Digital Economy & ICT", size: "sme" as const, open_roles: 24, graduate_satisfaction_score: 8.1, avg_time_to_fill_days: 45, is_vision_partner: false },
    { name: "Mater Dei Hospital", sector: "Healthcare & Life Sciences", size: "enterprise" as const, open_roles: 94, graduate_satisfaction_score: 7.4, avg_time_to_fill_days: 91, is_vision_partner: true },
    { name: "Enemalta Corporation", sector: "Green Economy & Energy", size: "large" as const, open_roles: 38, graduate_satisfaction_score: 6.8, avg_time_to_fill_days: 74, is_vision_partner: true },
    { name: "TIPICO Malta", sector: "Digital Economy & ICT", size: "large" as const, open_roles: 55, graduate_satisfaction_score: 8.4, avg_time_to_fill_days: 38, is_vision_partner: false }
  ],
  trajectoryPoints: [
    { sector: "Digital Economy & ICT", year: 2020, current_trajectory: 14200, vision_target: 20000, with_intervention: 14200, data_type: "historical" as const },
    { sector: "Digital Economy & ICT", year: 2022, current_trajectory: 16100, vision_target: 24000, with_intervention: 16100, data_type: "historical" as const },
    { sector: "Digital Economy & ICT", year: 2024, current_trajectory: 18400, vision_target: 28000, with_intervention: 18400, data_type: "historical" as const },
    { sector: "Digital Economy & ICT", year: 2028, current_trajectory: 22000, vision_target: 34000, with_intervention: 26500, data_type: "projected" as const },
    { sector: "Digital Economy & ICT", year: 2032, current_trajectory: 26000, vision_target: 40000, with_intervention: 34000, data_type: "projected" as const },
    { sector: "Digital Economy & ICT", year: 2036, current_trajectory: 30500, vision_target: 44000, with_intervention: 40500, data_type: "projected" as const },
    { sector: "Digital Economy & ICT", year: 2040, current_trajectory: 35000, vision_target: 47000, with_intervention: 46000, data_type: "projected" as const },
    { sector: "Digital Economy & ICT", year: 2045, current_trajectory: 40000, vision_target: 50000, with_intervention: 51000, data_type: "projected" as const },
    { sector: "Digital Economy & ICT", year: 2050, current_trajectory: 44000, vision_target: 52000, with_intervention: 54000, data_type: "projected" as const },
    // Financial Services trajectory
    { sector: "Financial Services", year: 2020, current_trajectory: 10200, vision_target: 14000, with_intervention: 10200, data_type: "historical" as const },
    { sector: "Financial Services", year: 2022, current_trajectory: 11400, vision_target: 17000, with_intervention: 11400, data_type: "historical" as const },
    { sector: "Financial Services", year: 2024, current_trajectory: 12800, vision_target: 20000, with_intervention: 12800, data_type: "historical" as const },
    { sector: "Financial Services", year: 2030, current_trajectory: 15200, vision_target: 22000, with_intervention: 18000, data_type: "projected" as const },
    { sector: "Financial Services", year: 2040, current_trajectory: 19800, vision_target: 25000, with_intervention: 24000, data_type: "projected" as const },
    { sector: "Financial Services", year: 2050, current_trajectory: 23000, vision_target: 28000, with_intervention: 27500, data_type: "projected" as const },
    // Healthcare trajectory
    { sector: "Healthcare & Life Sciences", year: 2020, current_trajectory: 7400, vision_target: 10000, with_intervention: 7400, data_type: "historical" as const },
    { sector: "Healthcare & Life Sciences", year: 2022, current_trajectory: 8200, vision_target: 12000, with_intervention: 8200, data_type: "historical" as const },
    { sector: "Healthcare & Life Sciences", year: 2024, current_trajectory: 9200, vision_target: 14000, with_intervention: 9200, data_type: "historical" as const },
    { sector: "Healthcare & Life Sciences", year: 2030, current_trajectory: 11000, vision_target: 15500, with_intervention: 13500, data_type: "projected" as const },
    { sector: "Healthcare & Life Sciences", year: 2040, current_trajectory: 14000, vision_target: 17500, with_intervention: 17000, data_type: "projected" as const },
    { sector: "Healthcare & Life Sciences", year: 2050, current_trajectory: 16000, vision_target: 19500, with_intervention: 19000, data_type: "projected" as const },
    // Green Economy trajectory
    { sector: "Green Economy & Energy", year: 2020, current_trajectory: 1800, vision_target: 4000, with_intervention: 1800, data_type: "historical" as const },
    { sector: "Green Economy & Energy", year: 2022, current_trajectory: 2400, vision_target: 6000, with_intervention: 2400, data_type: "historical" as const },
    { sector: "Green Economy & Energy", year: 2024, current_trajectory: 3100, vision_target: 8000, with_intervention: 3100, data_type: "historical" as const },
    { sector: "Green Economy & Energy", year: 2030, current_trajectory: 4200, vision_target: 9500, with_intervention: 6800, data_type: "projected" as const },
    { sector: "Green Economy & Energy", year: 2040, current_trajectory: 6800, vision_target: 12000, with_intervention: 11000, data_type: "projected" as const },
    { sector: "Green Economy & Energy", year: 2050, current_trajectory: 8500, vision_target: 14000, with_intervention: 13500, data_type: "projected" as const },
    // Creative Industries trajectory
    { sector: "Creative & Knowledge Industries", year: 2020, current_trajectory: 5200, vision_target: 8000, with_intervention: 5200, data_type: "historical" as const },
    { sector: "Creative & Knowledge Industries", year: 2022, current_trajectory: 5900, vision_target: 10000, with_intervention: 5900, data_type: "historical" as const },
    { sector: "Creative & Knowledge Industries", year: 2024, current_trajectory: 6800, vision_target: 12000, with_intervention: 6800, data_type: "historical" as const },
    { sector: "Creative & Knowledge Industries", year: 2030, current_trajectory: 8200, vision_target: 13500, with_intervention: 10000, data_type: "projected" as const },
    { sector: "Creative & Knowledge Industries", year: 2040, current_trajectory: 11000, vision_target: 16000, with_intervention: 15000, data_type: "projected" as const },
    { sector: "Creative & Knowledge Industries", year: 2050, current_trajectory: 13500, vision_target: 18000, with_intervention: 17500, data_type: "projected" as const },
  ]
}
