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
      // If the NASA endpoint returns 404 (resource not found), return a graceful JSON fallback
      if (response.status === 404) {
        // generate a simple daily fallback series between startDate and endDate
        const s = new Date(startDate + 'T00:00:00');
        const e = new Date(endDate + 'T23:59:59');
        const series = [];
        for (let d = new Date(s); d <= e; d.setUTCDate(d.getUTCDate() + 1)) {
          // create a plausible temperature in Kelvin (288K ~ 15C)
          const tempK = 288 + (Math.sin(d.getUTCDate() / 28 * Math.PI * 2) * 3);
          series.push({ timestamp: new Date(d).toISOString(), tempK });
        }

        const fallback = {
          fallback: true,
          note: `NASA API returned 404 for requested resource. Returning synthetic fallback series for ${lat},${lon}`,
          series,
        };

        return new Response(JSON.stringify(fallback), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      throw new Error(`NASA API failed with status: ${response.status}`);
    }

    const data = await response.text();

    return new Response(data, {
      headers: { ...corsHeaders, "Content-Type": "text/plain" },
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
