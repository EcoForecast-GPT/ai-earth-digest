import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RequestData {
  url: string;
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Received request:', req.url);
    
    const url = new URL(req.url);
    const lat = url.searchParams.get('lat');
    const lon = url.searchParams.get('lon');
    const startDate = url.searchParams.get('startDate');
    const endDate = url.searchParams.get('endDate');

    if (!lat || !lon || !startDate || !endDate) {
      throw new Error('Missing required parameters');
    }

    // Format the NASA NLDAS URL correctly with proper variable specification
    const nasaUrl = new URL('https://hydro1.gesdisc.eosdis.nasa.gov/daac-bin/access/timeseries.cgi');
    nasaUrl.searchParams.append('variable', 'NLDAS_FORA0125_H.002[0:23][0][0]');
    nasaUrl.searchParams.append('location', `GEOM:POINT(${lon}, ${lat})`);
    nasaUrl.searchParams.append('startDate', `${startDate}T00:00:00`);
    nasaUrl.searchParams.append('endDate', `${endDate}T23:59:59`);
    nasaUrl.searchParams.append('type', 'asc2');
    nasaUrl.searchParams.append('portals', 'GIOVANNI');

    // Retry logic for NASA API
    let response: Response | undefined;
    let retries = 3;
    let lastError = '';

    while (retries > 0) {
      try {
        console.log(`Attempt ${4-retries}: Fetching NASA API...`);
        
        response = await Promise.race([
          fetch(nasaUrl.toString(), {
            headers: {
              'Accept': 'text/plain,application/json',
              'User-Agent': 'Mozilla/5.0 (compatible; WeatherApp/1.0;)'
            }
          }),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Request timeout')), 15000)
          )
        ]) as Response;
        
        if (response.ok) {
          const text = await response.text();
          
          // Check for specific error messages in the response
          if (text.includes('ERROR:') || text.includes('error message')) {
            throw new Error(`NASA API returned error in response: ${text}`);
          }
          
          console.log('NASA API request successful');
          return new Response(JSON.stringify({ data: text }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
        
        lastError = `NASA API error: ${response.status}`;
        console.log(`Attempt failed: ${lastError}`);
        retries--;
        if (retries > 0) {
          console.log(`Waiting 2 seconds before retry...`);
          await new Promise(r => setTimeout(r, 2000));
        }
      } catch (e) {
        lastError = e instanceof Error ? e.message : 'Unknown error';
        console.log(`Attempt failed: ${lastError}`);
        retries--;
        if (retries > 0) {
          console.log(`Waiting 2 seconds before retry...`);
          await new Promise(r => setTimeout(r, 2000));
        }
      }
    }

    // If we get here, all retries failed
    console.error('All retry attempts failed');
    return new Response(
      JSON.stringify({ 
        error: lastError,
        data: [] // Return empty data array as fallback
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error in proxy-nasa-data:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        data: [] // Return empty data array as fallback
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});