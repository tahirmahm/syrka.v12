-- QS Rankings seed data: University of Malta 2024-2026
INSERT INTO university_rankings (institution_name, ranking_system, year, overall_rank, overall_score, ar_score, er_score, fsr_score, cpf_score, ifr_score, isr_score, irn_score, eo_score, sus_score, country, region)
VALUES
('University of Malta', 'QS', 2024, '851-900', NULL, 3.6, 5.2, 12.8, 2.1, 35.4, 11.2, 8.7, NULL, NULL, 'Malta', 'Europe'),
('University of Malta', 'QS', 2025, '751-760', NULL, 4.1, 6.8, 14.2, 3.4, 38.1, 19.2, 12.3, 5.1, 3.8, 'Malta', 'Europe'),
('University of Malta', 'QS', 2026, '741-750', NULL, 4.8, 7.5, 15.1, 3.9, 40.2, 42.2, 14.8, 6.3, 4.2, 'Malta', 'Europe')
ON CONFLICT (institution_name, ranking_system, year) DO UPDATE SET
  overall_rank = EXCLUDED.overall_rank, overall_score = EXCLUDED.overall_score,
  ar_score = EXCLUDED.ar_score, er_score = EXCLUDED.er_score, fsr_score = EXCLUDED.fsr_score,
  cpf_score = EXCLUDED.cpf_score, ifr_score = EXCLUDED.ifr_score, isr_score = EXCLUDED.isr_score,
  irn_score = EXCLUDED.irn_score, eo_score = EXCLUDED.eo_score, sus_score = EXCLUDED.sus_score;

-- Malta peer institutions
INSERT INTO university_rankings (institution_name, ranking_system, year, overall_rank, overall_score, ar_score, er_score, fsr_score, cpf_score, ifr_score, isr_score, country, region)
VALUES
('University of Cyprus', 'QS', 2026, '651-700', NULL, 8.2, 6.1, 18.3, 5.8, 22.4, 15.6, 'Cyprus', 'Europe'),
('University of Ljubljana', 'QS', 2026, '511-520', NULL, 14.8, 11.2, 22.1, 8.4, 12.8, 8.9, 'Slovenia', 'Europe'),
('Tallinn University of Technology', 'QS', 2026, '651-700', NULL, 7.4, 8.9, 19.5, 6.2, 28.3, 18.1, 'Estonia', 'Europe'),
('University of Luxembourg', 'QS', 2026, '381-390', NULL, 12.1, 9.8, 25.4, 18.9, 82.4, 62.3, 'Luxembourg', 'Europe')
ON CONFLICT (institution_name, ranking_system, year) DO UPDATE SET
  overall_rank = EXCLUDED.overall_rank, ar_score = EXCLUDED.ar_score, er_score = EXCLUDED.er_score,
  fsr_score = EXCLUDED.fsr_score, cpf_score = EXCLUDED.cpf_score, ifr_score = EXCLUDED.ifr_score,
  isr_score = EXCLUDED.isr_score;

-- QS Rankings: Saudi institutions 2024-2026
INSERT INTO university_rankings (institution_name, ranking_system, year, overall_rank, overall_score, ar_score, er_score, fsr_score, cpf_score, ifr_score, isr_score, irn_score, eo_score, sus_score, country, region)
VALUES
('King Fahd University of Petroleum and Minerals', 'QS', 2024, '186', 42.8, 18.4, 28.2, 42.1, 68.5, 12.8, 5.4, 22.1, 45.2, 18.6, 'Saudi Arabia', 'Arab Region'),
('King Fahd University of Petroleum and Minerals', 'QS', 2025, '101', 52.1, 22.6, 34.8, 48.3, 72.1, 14.2, 6.8, 28.4, 52.8, 22.1, 'Saudi Arabia', 'Arab Region'),
('King Fahd University of Petroleum and Minerals', 'QS', 2026, '67', 58.4, 26.8, 38.4, 52.1, 78.6, 16.4, 8.2, 32.6, 58.4, 25.8, 'Saudi Arabia', 'Arab Region'),
('King Saud University', 'QS', 2024, '203', 40.1, 32.4, 24.6, 18.2, 42.8, 8.4, 4.2, 18.6, 38.4, 15.2, 'Saudi Arabia', 'Arab Region'),
('King Saud University', 'QS', 2025, '167', 44.8, 36.2, 28.1, 20.4, 48.2, 9.8, 5.1, 22.4, 42.1, 18.6, 'Saudi Arabia', 'Arab Region'),
('King Saud University', 'QS', 2026, '145', 48.2, 38.8, 30.2, 22.8, 52.4, 10.6, 5.8, 24.8, 46.2, 20.4, 'Saudi Arabia', 'Arab Region'),
('King Abdulaziz University', 'QS', 2024, '252', 35.6, 28.4, 18.2, 15.4, 38.2, 6.8, 3.8, 15.2, 32.4, 12.8, 'Saudi Arabia', 'Arab Region'),
('King Abdulaziz University', 'QS', 2025, '221', 38.4, 30.8, 20.4, 17.2, 42.6, 7.4, 4.2, 18.8, 36.8, 14.6, 'Saudi Arabia', 'Arab Region'),
('King Abdulaziz University', 'QS', 2026, '187', 42.1, 34.2, 22.8, 19.6, 48.2, 8.2, 4.8, 22.4, 40.2, 16.8, 'Saudi Arabia', 'Arab Region')
ON CONFLICT (institution_name, ranking_system, year) DO UPDATE SET
  overall_rank = EXCLUDED.overall_rank, overall_score = EXCLUDED.overall_score,
  ar_score = EXCLUDED.ar_score, er_score = EXCLUDED.er_score, fsr_score = EXCLUDED.fsr_score,
  cpf_score = EXCLUDED.cpf_score, ifr_score = EXCLUDED.ifr_score, isr_score = EXCLUDED.isr_score,
  irn_score = EXCLUDED.irn_score, eo_score = EXCLUDED.eo_score, sus_score = EXCLUDED.sus_score;

-- Saudi peer institutions (GCC)
INSERT INTO university_rankings (institution_name, ranking_system, year, overall_rank, overall_score, ar_score, er_score, fsr_score, cpf_score, ifr_score, isr_score, country, region)
VALUES
('United Arab Emirates University', 'QS', 2026, '290', 32.4, 18.6, 14.2, 28.4, 22.8, 42.6, 28.4, 'UAE', 'Arab Region'),
('Qatar University', 'QS', 2026, '173', 46.2, 22.8, 26.4, 32.1, 38.4, 68.2, 52.4, 'Qatar', 'Arab Region')
ON CONFLICT (institution_name, ranking_system, year) DO UPDATE SET
  overall_rank = EXCLUDED.overall_rank, overall_score = EXCLUDED.overall_score,
  ar_score = EXCLUDED.ar_score, er_score = EXCLUDED.er_score, fsr_score = EXCLUDED.fsr_score,
  cpf_score = EXCLUDED.cpf_score, ifr_score = EXCLUDED.ifr_score, isr_score = EXCLUDED.isr_score;

-- THE Rankings: Key institutions
INSERT INTO university_rankings (institution_name, ranking_system, year, overall_rank, overall_score, the_teaching, the_research_quality, the_industry, the_international_outlook, country, region)
VALUES
('King Fahd University of Petroleum and Minerals', 'THE', 2026, '184', 52.8, 42.6, 48.2, 68.4, 38.2, 'Saudi Arabia', 'Arab Region'),
('King Saud University', 'THE', 2026, '301-350', 42.1, 36.4, 38.8, 52.1, 32.4, 'Saudi Arabia', 'Arab Region'),
('King Abdulaziz University', 'THE', 2026, '201-250', 48.4, 38.2, 52.4, 58.6, 34.8, 'Saudi Arabia', 'Arab Region'),
('King Abdullah University of Science and Technology', 'THE', 2026, 'Reporter', NULL, NULL, NULL, NULL, NULL, 'Saudi Arabia', 'Arab Region'),
('University of Malta', 'THE', 2026, '601-800', 28.4, 22.8, 18.4, 35.2, 42.6, 'Malta', 'Europe')
ON CONFLICT (institution_name, ranking_system, year) DO UPDATE SET
  overall_rank = EXCLUDED.overall_rank, overall_score = EXCLUDED.overall_score,
  the_teaching = EXCLUDED.the_teaching, the_research_quality = EXCLUDED.the_research_quality,
  the_industry = EXCLUDED.the_industry, the_international_outlook = EXCLUDED.the_international_outlook;
