// Minimal client JS to call the Python backend and render results
// Assumes backend endpoint at /api/nasa_weather?city=CityName

async function fetchNasaWeather(city) {
  try {
    const res = await fetch(`/api/nasa_weather?city=${encodeURIComponent(city)}`);
    if (!res.ok) throw new Error('API error');
    return await res.json();
  } catch (e) {
    return { error: e.message };
  }
}

function renderWeatherResult(data, container) {
  if (data.error) {
    container.innerHTML = `<div class='text-red-500'>${data.error}</div>`;
    return;
  }
  container.innerHTML = `
    <div class='font-bold text-lg mb-2'>${data.city} (${data.coords.lat.toFixed(2)}, ${data.coords.lon.toFixed(2)})</div>
    <div class='mb-2'>Trend: <span class='font-semibold'>${data.trend}</span></div>
    <div class='mb-2'>
      <b>POWER (Daily):</b> <pre>${JSON.stringify(data.power.daily, null, 2)}</pre>
    </div>
    <div class='mb-2'>
      <b>GEOS-CF Forecast (Next 5d, Daily Avg):</b> <pre>${JSON.stringify(data.geoscf_forecast.daily, null, 2)}</pre>
    </div>
  `;
}

// Example usage:
// const container = document.getElementById('weather-result');
// fetchNasaWeather('Dubai').then(data => renderWeatherResult(data, container));
