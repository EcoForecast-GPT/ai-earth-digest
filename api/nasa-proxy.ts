import type { Request, Response } from '@vercel/node';

export default async function handler(req: Request, res: Response) {
  const NASA_API_URL = 'https://hydro1.gesdisc.eosdis.nasa.gov/daac-bin/access/timeseries.cgi';

  try {
    // Reconstruct the NASA API URL from the incoming request's query parameters
    const searchParams = new URL(req.url!, `http://${req.headers.host}`).searchParams;
    const fullNasaUrl = `${NASA_API_URL}?${searchParams.toString()}`;

    // Fetch data from the actual NASA API
    const nasaRes = await fetch(fullNasaUrl);

    // Check if the request to NASA was successful
    if (!nasaRes.ok) {
      const errorText = await nasaRes.text();
      res.status(nasaRes.status).send(`Error from NASA API: ${errorText}`);
      return;
    }

    // Stream the response from NASA back to the client
    // Set the appropriate content-type header from the NASA response
    res.setHeader('Content-Type', nasaRes.headers.get('Content-Type') || 'text/plain');
    // Vercel automatically handles caching, but we can add this for clarity
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate');

    // Pipe the body of the response
    const readableStream = nasaRes.body;
    if (readableStream) {
        const reader = readableStream.getReader();
        while (true) {
            const { done, value } = await reader.read();
            if (done) {
                break;
            }
            res.write(value);
        }
        res.end();
    } else {
        res.status(500).send('No readable stream from NASA API');
    }

  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).send('Internal Server Error in proxy.');
  }
}