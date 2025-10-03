// Stateless predictor utilities that generate a deterministic forecast from historical series
// The functions here use only local historical points (timeSeries) and do not perform network I/O.

type Point = {
  time: string; // ISO timestamp
  temperature?: number;
  precipitation?: number;
  humidity?: number;
  windSpeed?: number;
};

const dayOfYear = (d: Date) => {
  const start = new Date(d.getFullYear(), 0, 0);
  const diff = d.getTime() - start.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
};

// Simple linear regression (y ~ a + b*x) for numeric arrays
const linearRegression = (xs: number[], ys: number[]) => {
  const n = xs.length;
  if (n === 0) return { a: 0, b: 0 };
  const meanX = xs.reduce((s, v) => s + v, 0) / n;
  const meanY = ys.reduce((s, v) => s + v, 0) / n;
  let num = 0;
  let den = 0;
  for (let i = 0; i < n; i++) {
    num += (xs[i] - meanX) * (ys[i] - meanY);
    den += (xs[i] - meanX) * (xs[i] - meanX);
  }
  const b = den === 0 ? 0 : num / den;
  const a = meanY - b * meanX;
  return { a, b };
};

export const predictWeatherFromSeries = (series: Point[], targetDate: Date) => {
  const targetDoy = dayOfYear(targetDate);
  const targetYear = targetDate.getFullYear();

  // map series to {doy, year, temperature, precipitation, humidity, wind}
  const mapped = series
    .map(p => ({
      time: p.time,
      doy: p.time ? dayOfYear(new Date(p.time)) : null,
      year: p.time ? new Date(p.time).getFullYear() : null,
      temperature: typeof p.temperature === 'number' ? p.temperature : null,
      precipitation: typeof p.precipitation === 'number' ? p.precipitation : null,
      humidity: typeof p.humidity === 'number' ? p.humidity : null,
      windSpeed: typeof p.windSpeed === 'number' ? p.windSpeed : null,
    }))
    .filter(p => p.doy !== null && p.year !== null);

  // Collect neighborhood points within windowDays (wrap around year)
  const windowDays = 15; // larger window for smoother seasonal estimate
  const candidates = mapped.filter(p => {
    const diff = Math.abs((p.doy as number) - targetDoy);
    const wrapped = Math.min(diff, 365 - diff);
    return wrapped <= windowDays;
  });

  // If too few candidates, expand to 60
  let effective = candidates;
  if (effective.length < 20) {
    const wide = 60;
    effective = mapped.filter(p => {
      const diff = Math.abs((p.doy as number) - targetDoy);
      const wrapped = Math.min(diff, 365 - diff);
      return wrapped <= wide;
    });
  }

  if (effective.length === 0) {
    throw new Error('Insufficient historical points for prediction');
  }

  // Group by year and compute year-aggregates (mean temperature per year for the window)
  const byYear: Record<number, { temps: number[]; precs: number[]; hums: number[]; winds: number[] }> = {};
  for (const p of effective) {
    const y = p.year as number;
    byYear[y] = byYear[y] || { temps: [], precs: [], hums: [], winds: [] };
    if (p.temperature !== null) byYear[y].temps.push(p.temperature as number);
    if (p.precipitation !== null) byYear[y].precs.push(p.precipitation as number);
    if (p.humidity !== null) byYear[y].hums.push(p.humidity as number);
    if (p.windSpeed !== null) byYear[y].winds.push(p.windSpeed as number);
  }

  const years = Object.keys(byYear).map(y => parseInt(y, 10)).sort((a, b) => a - b);

  const yearTemps: number[] = [];
  const yearXs: number[] = [];
  for (const y of years) {
    const arr = byYear[y].temps;
    if (arr.length) {
      yearXs.push(y);
      yearTemps.push(arr.reduce((s, v) => s + v, 0) / arr.length);
    }
  }

  // Fit simple linear trend of mean temp vs year (if enough years)
  let trendPredTemp = 0;
  if (yearTemps.length >= 2) {
    const { a, b } = linearRegression(yearXs, yearTemps);
    trendPredTemp = a + b * targetYear;
  }

  // Seasonal mean across all effective points for day-of-year window
  const seasonalTemps = effective.filter(p => p.temperature !== null).map(p => p.temperature as number);
  const seasonalMean = seasonalTemps.length ? seasonalTemps.reduce((s, v) => s + v, 0) / seasonalTemps.length : trendPredTemp || seasonalTemps[0] || 0;

  // Blend trend and seasonal mean: if trend exists, weight by number of years
  const yearsCount = yearTemps.length;
  let finalTemp = seasonalMean;
  if (yearsCount >= 2) {
    const trendWeight = Math.min(0.7, 0.3 + Math.log1p(yearsCount) * 0.05);
    finalTemp = seasonalMean * (1 - trendWeight) + trendPredTemp * trendWeight;
  }

  // Precipitation: median of effective
  const precs = effective.filter(p => p.precipitation !== null).map(p => p.precipitation as number).sort((a,b)=>a-b);
  const medianPrecip = precs.length ? (precs[Math.floor(precs.length/2)]) : 0;

  // Humidity & wind: weighted average across effective points weighted by recency (year proximity)
  const weights = effective.map(p => 1 / (1 + Math.abs((p.year as number) - targetYear)));
  const weightedAvg = (vals: (number | null)[]) => {
    let sw = 0; let s = 0;
    for (let i = 0; i < vals.length; i++) {
      const v = vals[i];
      if (v === null) continue;
      const w = weights[i] || 1;
      s += v * w; sw += w;
    }
    return sw ? s / sw : 0;
  };

  const humidity = Math.round(weightedAvg(effective.map(p => p.humidity !== null ? p.humidity as number : null)));
  const windSpeed = Math.round((weightedAvg(effective.map(p => p.windSpeed !== null ? p.windSpeed as number : null))) * 10) / 10;

  // Apply light smoothing and clamps
  const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
  const predicted = {
    temperature: Math.round(finalTemp * 10) / 10,
    precipitation: Math.round(medianPrecip * 10) / 10,
    humidity: clamp(humidity, 0, 100),
    windSpeed: clamp(windSpeed, 0, 200),
  };

  return predicted;
};

export default { predictWeatherFromSeries };
