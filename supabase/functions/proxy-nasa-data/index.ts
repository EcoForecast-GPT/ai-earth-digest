import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const { lat, lon, startDate, endDate } = Object.fromEntries(url.searchParams.entries());

    if (!lat || !lon || !startDate || !endDate) {
      return new Response(JSON.stringify({ error: "Missing required query parameters." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Use POWER API instead as it doesn't require auth
    const nasaUrl = `https://power.larc.nasa.gov/api/temporal/hourly/point?parameters=T2M,PRECTOT,RH2M,WS2M&community=RE&longitude=${lon}&latitude=${lat}&start=${startDate}&end=${endDate}&format=JSON`;
    
    const response = await fetch(nasaUrl, {
      headers: {
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      // Log error details for debugging
      const errText = await response.text();
      console.error('NASA POWER API error:', {
        status: response.status,
        statusText: response.statusText,
        body: errText
      });
      
      return new Response(JSON.stringify({ 
        error: `NASA API failed with status: ${response.status}`,
        details: errText
      }), {
        status: response.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const data = await response.json();
    
    // Basic validation of POWER API response
    if (!data.properties || !data.properties.parameter) {
      return new Response(JSON.stringify({ 
        error: 'Invalid NASA POWER API response format',
        details: 'Missing required data structure'
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
