const https = require('https');
const { URL } = require('url');

// Usage: set environment variables SUPABASE_URL and SUPABASE_ANON_KEY (or NEXT_PUBLIC_* / VITE_*)
// Example (PowerShell):
// $env:NEXT_PUBLIC_SUPABASE_URL='https://your.supabase.co'; $env:NEXT_PUBLIC_SUPABASE_ANON_KEY='anonkey'; node .\scripts\validate_supabase_key.js

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_ACCESS_TOKEN;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing environment variables. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY (or VITE_ variants) before running this script.');
  process.exit(1);
}

const testUrl = new URL(`${supabaseUrl.replace(/\/$/, '')}/functions/v1/proxy-nasa-data`);
testUrl.searchParams.append('lat', '37.7749');
testUrl.searchParams.append('lon', '-122.4194');
testUrl.searchParams.append('startDate', '2025-09-20');
testUrl.searchParams.append('endDate', '2025-09-21');

const options = {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${supabaseAnonKey}`,
    'apikey': supabaseAnonKey,
  }
};

console.log('Testing Supabase Functions endpoint:', testUrl.toString());

const req = https.request(testUrl, options, (res) => {
  console.log('STATUS:', res.statusCode);
  console.log('HEADERS:', res.headers);
  let body = '';
  res.setEncoding('utf8');
  res.on('data', (chunk) => body += chunk);
  res.on('end', () => {
    console.log('BODY:', body.slice(0, 1000));
    if (res.statusCode >= 400) process.exit(2);
  });
});

req.on('error', (e) => {
  console.error('Request error:', e.message);
  process.exit(3);
});

req.end();
