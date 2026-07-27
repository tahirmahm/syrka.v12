export function baseChartConfig(country: string) {
  const accent = ({ saudi: '#C9A84C', malta: '#1D9E75', uk: '#3B8BD4' } as Record<string, string>)[country] || '#C9A84C'
  return {
    backgroundColor: 'transparent',
    textStyle: { fontFamily: 'Inter, system-ui, sans-serif', color: '#8B949E' },
    grid: { left: 40, right: 12, top: 12, bottom: 28, containLabel: false },
    xAxis: {
      axisLine: { lineStyle: { color: '#21262D', width: 0.5 } },
      axisTick: { show: false },
      axisLabel: { fontSize: 10, color: '#484F58' },
      splitLine: { show: false },
    },
    yAxis: {
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { fontSize: 10, color: '#484F58' },
      splitLine: { lineStyle: { color: '#21262D', width: 0.5, type: 'dashed' as const } },
    },
    tooltip: {
      backgroundColor: '#161B22',
      borderColor: '#30363D',
      borderWidth: 0.5,
      textStyle: { color: '#C9D1D9', fontSize: 12 },
      padding: [8, 12],
    },
    color: [accent, '#3FB950', '#F85149', '#484F58'],
  }
}
