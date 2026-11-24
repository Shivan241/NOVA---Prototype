/*
 * Isolated weather service powered by Open-Meteo (free, no API key required).
 * Performs geocoding and fetches current conditions + daily highs/lows.
 */

export interface WeatherReport {
  location: string;
  country: string;
  temperatureC: number;
  apparentC: number;
  humidityPercent: number;
  windKmh: number;
  condition: string;
  highC: number;
  lowC: number;
}

const WMO_CODES: Record<number, string> = {
  0: 'Clear sky',
  1: 'Mainly clear',
  2: 'Partly cloudy',
  3: 'Overcast',
  45: 'Foggy',
  48: 'Depositing rime fog',
  51: 'Light drizzle',
  53: 'Moderate drizzle',
  55: 'Dense drizzle',
  61: 'Slight rain',
  63: 'Moderate rain',
  65: 'Heavy rain',
  71: 'Slight snow',
  73: 'Moderate snow',
  75: 'Heavy snow',
  80: 'Rain showers',
  81: 'Moderate showers',
  82: 'Heavy showers',
  95: 'Thunderstorm',
};

export async function fetchWeatherForCity(city: string): Promise<WeatherReport> {
  const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
    city
  )}&count=1&language=en&format=json`;
  const geoRes = await fetch(geoUrl);
  if (!geoRes.ok) {
    throw new Error(`Geocoding failed (${geoRes.status})`);
  }
  const geoData = (await geoRes.json()) as {
    results?: Array<{
      name: string;
      country?: string;
      latitude: number;
      longitude: number;
    }>;
  };

  const place = geoData.results?.[0];
  if (!place) {
    throw new Error(`Could not find location "${city}".`);
  }

  const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${place.latitude}&longitude=${place.longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m&daily=temperature_2m_max,temperature_2m_min&timezone=auto&forecast_days=1`;
  const weatherRes = await fetch(weatherUrl);
  if (!weatherRes.ok) {
    throw new Error(`Weather API failed (${weatherRes.status})`);
  }
  const data = (await weatherRes.json()) as {
    current: {
      temperature_2m: number;
      apparent_temperature: number;
      relative_humidity_2m: number;
      wind_speed_10m: number;
      weather_code: number;
    };
    daily: {
      temperature_2m_max: number[];
      temperature_2m_min: number[];
    };
  };

  return {
    location: place.name,
    country: place.country ?? '',
    temperatureC: Math.round(data.current.temperature_2m),
    apparentC: Math.round(data.current.apparent_temperature),
    humidityPercent: Math.round(data.current.relative_humidity_2m),
    windKmh: Math.round(data.current.wind_speed_10m),
    condition: WMO_CODES[data.current.weather_code] ?? 'Clear',
    highC: Math.round(data.daily.temperature_2m_max[0] ?? data.current.temperature_2m),
    lowC: Math.round(data.daily.temperature_2m_min[0] ?? data.current.temperature_2m),
  };
}
