-- International benchmarking seed data
-- Source: World Bank (2019-2023), WEF GCI 4.0 (2019)
-- Run this in your Supabase SQL Editor

-- World Bank: Unemployment rate (%)
INSERT INTO international_stats (country_code, source, indicator_code, indicator_name, year, value, unit) VALUES
('MT', 'worldbank', 'SL.UEM.TOTL.ZS', 'Unemployment rate', 2023, 3.1, '%'),
('MT', 'worldbank', 'SL.UEM.TOTL.ZS', 'Unemployment rate', 2022, 2.9, '%'),
('MT', 'worldbank', 'SL.UEM.TOTL.ZS', 'Unemployment rate', 2021, 3.4, '%'),
('MT', 'worldbank', 'SL.UEM.TOTL.ZS', 'Unemployment rate', 2020, 4.3, '%'),
('MT', 'worldbank', 'SL.UEM.TOTL.ZS', 'Unemployment rate', 2019, 3.4, '%'),
('SA', 'worldbank', 'SL.UEM.TOTL.ZS', 'Unemployment rate', 2023, 5.1, '%'),
('SA', 'worldbank', 'SL.UEM.TOTL.ZS', 'Unemployment rate', 2022, 5.6, '%'),
('SA', 'worldbank', 'SL.UEM.TOTL.ZS', 'Unemployment rate', 2021, 6.6, '%'),
('SA', 'worldbank', 'SL.UEM.TOTL.ZS', 'Unemployment rate', 2020, 7.4, '%'),
('SA', 'worldbank', 'SL.UEM.TOTL.ZS', 'Unemployment rate', 2019, 5.6, '%'),
('CY', 'worldbank', 'SL.UEM.TOTL.ZS', 'Unemployment rate', 2023, 6.1, '%'),
('CY', 'worldbank', 'SL.UEM.TOTL.ZS', 'Unemployment rate', 2022, 6.8, '%'),
('CY', 'worldbank', 'SL.UEM.TOTL.ZS', 'Unemployment rate', 2021, 7.5, '%'),
('CY', 'worldbank', 'SL.UEM.TOTL.ZS', 'Unemployment rate', 2020, 7.6, '%'),
('EE', 'worldbank', 'SL.UEM.TOTL.ZS', 'Unemployment rate', 2023, 6.4, '%'),
('EE', 'worldbank', 'SL.UEM.TOTL.ZS', 'Unemployment rate', 2022, 5.6, '%'),
('EE', 'worldbank', 'SL.UEM.TOTL.ZS', 'Unemployment rate', 2021, 6.2, '%'),
('EE', 'worldbank', 'SL.UEM.TOTL.ZS', 'Unemployment rate', 2020, 6.8, '%'),
('SI', 'worldbank', 'SL.UEM.TOTL.ZS', 'Unemployment rate', 2023, 3.7, '%'),
('SI', 'worldbank', 'SL.UEM.TOTL.ZS', 'Unemployment rate', 2022, 4.0, '%'),
('SI', 'worldbank', 'SL.UEM.TOTL.ZS', 'Unemployment rate', 2021, 4.7, '%'),
('SI', 'worldbank', 'SL.UEM.TOTL.ZS', 'Unemployment rate', 2020, 5.0, '%'),
('LU', 'worldbank', 'SL.UEM.TOTL.ZS', 'Unemployment rate', 2023, 5.2, '%'),
('LU', 'worldbank', 'SL.UEM.TOTL.ZS', 'Unemployment rate', 2022, 4.6, '%'),
('LU', 'worldbank', 'SL.UEM.TOTL.ZS', 'Unemployment rate', 2021, 5.3, '%'),
('LU', 'worldbank', 'SL.UEM.TOTL.ZS', 'Unemployment rate', 2020, 6.8, '%'),
('AE', 'worldbank', 'SL.UEM.TOTL.ZS', 'Unemployment rate', 2023, 2.7, '%'),
('AE', 'worldbank', 'SL.UEM.TOTL.ZS', 'Unemployment rate', 2022, 2.9, '%'),
('AE', 'worldbank', 'SL.UEM.TOTL.ZS', 'Unemployment rate', 2021, 3.1, '%'),
('AE', 'worldbank', 'SL.UEM.TOTL.ZS', 'Unemployment rate', 2020, 3.2, '%'),
('QA', 'worldbank', 'SL.UEM.TOTL.ZS', 'Unemployment rate', 2023, 0.1, '%'),
('QA', 'worldbank', 'SL.UEM.TOTL.ZS', 'Unemployment rate', 2022, 0.1, '%'),
('QA', 'worldbank', 'SL.UEM.TOTL.ZS', 'Unemployment rate', 2021, 0.2, '%'),
('BH', 'worldbank', 'SL.UEM.TOTL.ZS', 'Unemployment rate', 2023, 1.3, '%'),
('BH', 'worldbank', 'SL.UEM.TOTL.ZS', 'Unemployment rate', 2022, 1.5, '%'),
('KW', 'worldbank', 'SL.UEM.TOTL.ZS', 'Unemployment rate', 2023, 2.1, '%'),
('KW', 'worldbank', 'SL.UEM.TOTL.ZS', 'Unemployment rate', 2022, 2.3, '%')
ON CONFLICT (country_code, source, indicator_code, year) DO UPDATE SET value = EXCLUDED.value;

-- World Bank: Education expenditure (% of GDP)
INSERT INTO international_stats (country_code, source, indicator_code, indicator_name, year, value, unit) VALUES
('MT', 'worldbank', 'SE.XPD.TOTL.GD.ZS', 'Education expenditure % GDP', 2022, 5.4, '% of GDP'),
('MT', 'worldbank', 'SE.XPD.TOTL.GD.ZS', 'Education expenditure % GDP', 2021, 5.9, '% of GDP'),
('MT', 'worldbank', 'SE.XPD.TOTL.GD.ZS', 'Education expenditure % GDP', 2020, 6.2, '% of GDP'),
('SA', 'worldbank', 'SE.XPD.TOTL.GD.ZS', 'Education expenditure % GDP', 2022, 5.6, '% of GDP'),
('SA', 'worldbank', 'SE.XPD.TOTL.GD.ZS', 'Education expenditure % GDP', 2021, 7.8, '% of GDP'),
('SA', 'worldbank', 'SE.XPD.TOTL.GD.ZS', 'Education expenditure % GDP', 2020, 7.0, '% of GDP'),
('CY', 'worldbank', 'SE.XPD.TOTL.GD.ZS', 'Education expenditure % GDP', 2022, 5.5, '% of GDP'),
('EE', 'worldbank', 'SE.XPD.TOTL.GD.ZS', 'Education expenditure % GDP', 2022, 6.6, '% of GDP'),
('SI', 'worldbank', 'SE.XPD.TOTL.GD.ZS', 'Education expenditure % GDP', 2022, 5.1, '% of GDP'),
('LU', 'worldbank', 'SE.XPD.TOTL.GD.ZS', 'Education expenditure % GDP', 2022, 3.9, '% of GDP'),
('AE', 'worldbank', 'SE.XPD.TOTL.GD.ZS', 'Education expenditure % GDP', 2021, 3.0, '% of GDP'),
('QA', 'worldbank', 'SE.XPD.TOTL.GD.ZS', 'Education expenditure % GDP', 2021, 1.8, '% of GDP'),
('BH', 'worldbank', 'SE.XPD.TOTL.GD.ZS', 'Education expenditure % GDP', 2021, 2.3, '% of GDP'),
('KW', 'worldbank', 'SE.XPD.TOTL.GD.ZS', 'Education expenditure % GDP', 2020, 6.6, '% of GDP')
ON CONFLICT (country_code, source, indicator_code, year) DO UPDATE SET value = EXCLUDED.value;

-- World Bank: R&D expenditure (% of GDP)
INSERT INTO international_stats (country_code, source, indicator_code, indicator_name, year, value, unit) VALUES
('MT', 'worldbank', 'GB.XPD.RSDV.GD.ZS', 'R&D expenditure % GDP', 2022, 0.68, '% of GDP'),
('MT', 'worldbank', 'GB.XPD.RSDV.GD.ZS', 'R&D expenditure % GDP', 2021, 0.65, '% of GDP'),
('SA', 'worldbank', 'GB.XPD.RSDV.GD.ZS', 'R&D expenditure % GDP', 2022, 0.80, '% of GDP'),
('CY', 'worldbank', 'GB.XPD.RSDV.GD.ZS', 'R&D expenditure % GDP', 2022, 0.75, '% of GDP'),
('EE', 'worldbank', 'GB.XPD.RSDV.GD.ZS', 'R&D expenditure % GDP', 2022, 1.77, '% of GDP'),
('SI', 'worldbank', 'GB.XPD.RSDV.GD.ZS', 'R&D expenditure % GDP', 2022, 2.14, '% of GDP'),
('LU', 'worldbank', 'GB.XPD.RSDV.GD.ZS', 'R&D expenditure % GDP', 2022, 1.00, '% of GDP'),
('AE', 'worldbank', 'GB.XPD.RSDV.GD.ZS', 'R&D expenditure % GDP', 2021, 1.30, '% of GDP'),
('QA', 'worldbank', 'GB.XPD.RSDV.GD.ZS', 'R&D expenditure % GDP', 2019, 0.50, '% of GDP')
ON CONFLICT (country_code, source, indicator_code, year) DO UPDATE SET value = EXCLUDED.value;

-- World Bank: Labor force participation (%)
INSERT INTO international_stats (country_code, source, indicator_code, indicator_name, year, value, unit) VALUES
('MT', 'worldbank', 'SL.TLF.CACT.ZS', 'Labor force participation', 2023, 66.7, '%'),
('MT', 'worldbank', 'SL.TLF.CACT.ZS', 'Labor force participation', 2022, 65.4, '%'),
('MT', 'worldbank', 'SL.TLF.CACT.ZS', 'Labor force participation', 2021, 63.8, '%'),
('SA', 'worldbank', 'SL.TLF.CACT.ZS', 'Labor force participation', 2023, 61.3, '%'),
('SA', 'worldbank', 'SL.TLF.CACT.ZS', 'Labor force participation', 2022, 59.7, '%'),
('SA', 'worldbank', 'SL.TLF.CACT.ZS', 'Labor force participation', 2021, 58.3, '%'),
('CY', 'worldbank', 'SL.TLF.CACT.ZS', 'Labor force participation', 2023, 65.2, '%'),
('EE', 'worldbank', 'SL.TLF.CACT.ZS', 'Labor force participation', 2023, 68.8, '%'),
('SI', 'worldbank', 'SL.TLF.CACT.ZS', 'Labor force participation', 2023, 62.3, '%'),
('LU', 'worldbank', 'SL.TLF.CACT.ZS', 'Labor force participation', 2023, 62.0, '%'),
('AE', 'worldbank', 'SL.TLF.CACT.ZS', 'Labor force participation', 2023, 83.4, '%'),
('QA', 'worldbank', 'SL.TLF.CACT.ZS', 'Labor force participation', 2023, 87.0, '%'),
('BH', 'worldbank', 'SL.TLF.CACT.ZS', 'Labor force participation', 2023, 73.1, '%'),
('KW', 'worldbank', 'SL.TLF.CACT.ZS', 'Labor force participation', 2023, 73.6, '%')
ON CONFLICT (country_code, source, indicator_code, year) DO UPDATE SET value = EXCLUDED.value;

-- World Bank: GDP per capita PPP (current international $)
INSERT INTO international_stats (country_code, source, indicator_code, indicator_name, year, value, unit) VALUES
('MT', 'worldbank', 'NY.GDP.PCAP.PP.CD', 'GDP per capita PPP', 2023, 56380, 'current international $'),
('MT', 'worldbank', 'NY.GDP.PCAP.PP.CD', 'GDP per capita PPP', 2022, 53720, 'current international $'),
('SA', 'worldbank', 'NY.GDP.PCAP.PP.CD', 'GDP per capita PPP', 2023, 56900, 'current international $'),
('SA', 'worldbank', 'NY.GDP.PCAP.PP.CD', 'GDP per capita PPP', 2022, 55380, 'current international $'),
('CY', 'worldbank', 'NY.GDP.PCAP.PP.CD', 'GDP per capita PPP', 2023, 50100, 'current international $'),
('EE', 'worldbank', 'NY.GDP.PCAP.PP.CD', 'GDP per capita PPP', 2023, 46580, 'current international $'),
('SI', 'worldbank', 'NY.GDP.PCAP.PP.CD', 'GDP per capita PPP', 2023, 51660, 'current international $'),
('LU', 'worldbank', 'NY.GDP.PCAP.PP.CD', 'GDP per capita PPP', 2023, 137950, 'current international $'),
('AE', 'worldbank', 'NY.GDP.PCAP.PP.CD', 'GDP per capita PPP', 2023, 78450, 'current international $'),
('QA', 'worldbank', 'NY.GDP.PCAP.PP.CD', 'GDP per capita PPP', 2023, 112280, 'current international $'),
('BH', 'worldbank', 'NY.GDP.PCAP.PP.CD', 'GDP per capita PPP', 2023, 58710, 'current international $'),
('KW', 'worldbank', 'NY.GDP.PCAP.PP.CD', 'GDP per capita PPP', 2023, 52980, 'current international $')
ON CONFLICT (country_code, source, indicator_code, year) DO UPDATE SET value = EXCLUDED.value;

-- WEF: Global Competitiveness Index 4.0 (2019 - last published)
INSERT INTO international_stats (country_code, source, indicator_code, indicator_name, year, value, unit) VALUES
('MT', 'wef', 'GCI_4.0', 'Global Competitiveness Index 4.0', 2019, 68.5, 'score (0-100)'),
('SA', 'wef', 'GCI_4.0', 'Global Competitiveness Index 4.0', 2019, 70.0, 'score (0-100)'),
('CY', 'wef', 'GCI_4.0', 'Global Competitiveness Index 4.0', 2019, 66.4, 'score (0-100)'),
('EE', 'wef', 'GCI_4.0', 'Global Competitiveness Index 4.0', 2019, 70.9, 'score (0-100)'),
('SI', 'wef', 'GCI_4.0', 'Global Competitiveness Index 4.0', 2019, 70.2, 'score (0-100)'),
('LU', 'wef', 'GCI_4.0', 'Global Competitiveness Index 4.0', 2019, 77.0, 'score (0-100)'),
('AE', 'wef', 'GCI_4.0', 'Global Competitiveness Index 4.0', 2019, 75.0, 'score (0-100)'),
('QA', 'wef', 'GCI_4.0', 'Global Competitiveness Index 4.0', 2019, 72.9, 'score (0-100)'),
('BH', 'wef', 'GCI_4.0', 'Global Competitiveness Index 4.0', 2019, 65.4, 'score (0-100)'),
('KW', 'wef', 'GCI_4.0', 'Global Competitiveness Index 4.0', 2019, 65.1, 'score (0-100)')
ON CONFLICT (country_code, source, indicator_code, year) DO UPDATE SET value = EXCLUDED.value;
