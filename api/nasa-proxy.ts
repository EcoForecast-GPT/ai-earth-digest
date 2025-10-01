import type { Request, Response } from '@vercel/node';

export default async function handler(req: Request, res: Response) {
  const NASA_POWER_URL = 'https://power.larc.nasa.gov/api/temporal/hourly/point';

  try {
    const { lat, lon, start, end } = req.query;
    
    // Construct NASA POWER API request
    const parameters = [
      'T2M',           // Temperature at 2 Meters (°C)
      'PRECTOT',       // Precipitation (mm/day)
      'RH2M',          // Relative Humidity at 2 Meters (%)
      'WS2M',          // Wind Speed at 2 Meters (m/s)
      'PS'             // Surface Pressure (kPa)
    ].join(',');

    const powerUrl = `${NASA_POWER_URL}?parameters=${parameters}&community=RE&longitude=${lon}&latitude=${lat}&start=${start}&end=${end}&format=JSON`;

    // Fetch data from NASA POWER API
    const nasaRes = await fetch(powerUrl);

    if (!nasaRes.ok) {
      const errorText = await nasaRes.text();
      res.status(nasaRes.status).json({ error: `Error from NASA POWER API: ${errorText}` });
      return;
    }

    const data = await nasaRes.json();
    
    // Return the processed data
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate');
    res.json(data);

  } catch (error) {
    console.error('Error in NASA POWER API proxy:', error);
    res.status(500).json({ error: 'Internal Server Error in proxy.' });
  }
}