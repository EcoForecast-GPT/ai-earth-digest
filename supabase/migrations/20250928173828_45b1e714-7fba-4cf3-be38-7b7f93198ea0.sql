-- Enable Row Level Security on nasa_weather table
ALTER TABLE public.nasa_weather ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read weather data
CREATE POLICY "Allow authenticated users to read weather data" 
ON public.nasa_weather 
FOR SELECT 
TO authenticated 
USING (true);

-- Allow public read access to weather data (weather is public information)
CREATE POLICY "Allow public read access to weather data" 
ON public.nasa_weather 
FOR SELECT 
TO anon 
USING (true);

-- Restrict INSERT/UPDATE/DELETE to service role only (for data ingestion)
-- This prevents users from modifying weather data directly
CREATE POLICY "Only service role can insert weather data" 
ON public.nasa_weather 
FOR INSERT 
TO service_role 
WITH CHECK (true);

CREATE POLICY "Only service role can update weather data" 
ON public.nasa_weather 
FOR UPDATE 
TO service_role 
USING (true);

CREATE POLICY "Only service role can delete weather data" 
ON public.nasa_weather 
FOR DELETE 
TO service_role 
USING (true);