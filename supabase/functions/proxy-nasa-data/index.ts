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

    const nasaUrl = `https://hydro1.gesdisc.eosdis.nasa.gov/daac-bin/access/timeseries.cgi?variable=NLDAS_FORA0125_H_002:Tair_f_inst&location=GEOM:POINT(${lon},%20${lat})&startDate=${startDate}T00:00:00&endDate=${endDate}T23:59:59&type=asc2`;

    const response = await fetch(nasaUrl);

    if (!response.ok) {
      // Do not fabricate data. If NASA returns 404 or any other error, forward an error.
      const errText = `NASA API failed with status: ${response.status}`;
      return new Response(JSON.stringify({ error: errText }), {
        status: response.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const data = await response.text();

    return new Response(data, {
      headers: { ...corsHeaders, "Content-Type": "text/plain" },
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
