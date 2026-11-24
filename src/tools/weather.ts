/*
 * Weather plug-in tool delegating API calls to the isolated services/weather.ts module.
 */

import { fetchWeatherForCity } from '../services/weather';
import type { NovaToolDefinition } from '../types';

export const weatherTool: NovaToolDefinition = {
  name: 'get_weather',
  description: 'Fetch real-time weather conditions and forecast for a city.',
  parameters: {
    type: 'OBJECT',
    properties: {
      city: { type: 'STRING', description: 'City name, e.g. Bengaluru, Tokyo, London.' },
    },
    required: ['city'],
  },
  async execute(args) {
    const city = String(args.city ?? '').trim();
    const report = await fetchWeatherForCity(city);
    return { ...report };
  },
};
