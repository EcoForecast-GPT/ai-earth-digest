interface WeatherAdvice {
  clothing: string[];
  activities: string[];
  warnings: string[];
  comfort: string;
  recommendations: string[];
}

export function generateWeatherAdvice(weatherData: any): WeatherAdvice {
  const temp = weatherData.temperature;
  const humidity = weatherData.humidity;
  const precip = weatherData.precipitation;
  const wind = weatherData.windSpeed;
  const uv = weatherData.uvIndex;
  
  const advice: WeatherAdvice = {
    clothing: [],
    activities: [],
    warnings: [],
    comfort: '',
    recommendations: []
  };

  // Temperature-based clothing advice
  if (temp <= 0) {
    advice.clothing.push('You\'ll need winter clothing: warm coat, gloves, scarf, and winter boots');
    advice.comfort = 'It\'s freezing cold';
  } else if (temp < 10) {
    advice.clothing.push('Dress warmly with layers, a warm jacket, and long sleeves');
    advice.comfort = 'It\'s quite cold';
  } else if (temp < 20) {
    advice.clothing.push('A light jacket or sweater would be comfortable');
    advice.comfort = 'It\'s cool but pleasant';
  } else if (temp < 25) {
    advice.clothing.push('Light clothing is fine, maybe bring a light layer for shade');
    advice.comfort = 'It\'s comfortable';
  } else if (temp < 30) {
    advice.clothing.push('Summer clothing: light, breathable fabrics');
    advice.comfort = 'It\'s warm';
  } else {
    advice.clothing.push('Very light clothing, sun protection is essential');
    advice.comfort = 'It\'s very hot';
  }

  // UV Protection
  if (uv >= 6) {
    advice.clothing.push('Sunscreen is essential (SPF 30+)');
    advice.clothing.push('Sunglasses and a hat are recommended');
    advice.warnings.push('High UV levels - protect your skin');
  } else if (uv >= 3) {
    advice.clothing.push('Some sun protection recommended');
  }

  // Rain protection
  if (precip > 5) {
    advice.clothing.push('Bring an umbrella and waterproof jacket');
    if (precip > 10) {
      advice.clothing.push('Waterproof footwear recommended');
    }
  }

  // Wind considerations
  if (wind > 20) {
    advice.clothing.push('Wind protection recommended');
    advice.warnings.push('Strong winds - secure loose items');
  }

  // Activity recommendations
  if (temp >= 15 && temp <= 25 && precip < 5 && wind < 15) {
    advice.activities.push('Perfect weather for outdoor activities');
  }

  if (temp > 30) {
    advice.activities.push('Indoor activities recommended during peak heat');
    advice.recommendations.push('Stay hydrated');
    advice.recommendations.push('Avoid strenuous outdoor activities');
  }

  if (precip > 5) {
    advice.activities.push('Indoor activities recommended');
    advice.activities.push('Check indoor venues');
  }

  // Comfort factors
  if (humidity > 70) {
    advice.comfort += ', humid';
    if (temp > 25) {
      advice.recommendations.push('High humidity - stay hydrated');
    }
  } else if (humidity < 30) {
    advice.comfort += ', dry';
    advice.recommendations.push('Low humidity - stay hydrated');
  }

  return advice;
}

export function answerCommonQuestion(
  questionType: 'clothing' | 'activities' | 'comfort' | 'risk' | 'comparison',
  weatherData: any,
  context?: {
    timeOfDay?: string;
    date?: Date;
    previousWeather?: any;
  }
): string {
  const advice = generateWeatherAdvice(weatherData);
  
  switch (questionType) {
    case 'clothing':
      return `For these conditions: ${advice.clothing.join('. ')}`;
      
    case 'activities':
      const activityAdvice = advice.activities.length > 0 
        ? advice.activities.join('. ')
        : 'No specific activity restrictions, but check the forecast closer to the time';
      return `${activityAdvice}${advice.warnings.length ? '. Note: ' + advice.warnings.join('. ') : ''}`;
      
    case 'comfort':
      return `${advice.comfort}. ${advice.recommendations.join('. ')}`;
      
    case 'risk':
      const risks = advice.warnings.length > 0 
        ? advice.warnings.join('. ')
        : 'No significant weather risks identified';
      return risks;
      
    case 'comparison':
      if (!context?.previousWeather) return 'I need previous weather data to make a comparison';
      const tempDiff = weatherData.temperature - context.previousWeather.temperature;
      const humidityDiff = weatherData.humidity - context.previousWeather.humidity;
      
      let comparison = `It will be ${Math.abs(tempDiff).toFixed(1)}°C ${tempDiff > 0 ? 'warmer' : 'cooler'}`;
      if (Math.abs(humidityDiff) > 10) {
        comparison += ` and ${humidityDiff > 0 ? 'more' : 'less'} humid`;
      }
      return comparison;
      
    default:
      return 'I understand you have a question about the weather. Could you please be more specific?';
  }
}

export function generateNaturalResponse(
  weatherData: any,
  query: string,
  context?: {
    timeOfDay?: string;
    date?: Date;
    location?: string;
    previousWeather?: any;
  }
): string {
  const advice = generateWeatherAdvice(weatherData);
  
  // Build a natural, contextual response
  let response = '';
  
  // Add time context if available
  if (context?.timeOfDay) {
    response += `For ${context.timeOfDay}${context.location ? ' in ' + context.location : ''}: `;
  }
  
  // Add main weather description
  response += `${advice.comfort}`;
  
  // Add relevant details based on query content
  if (query.match(/wear|clothing|dress/i)) {
    response += `. ${advice.clothing.join('. ')}`;
  }
  
  if (query.match(/activity|plan|do|go/i)) {
    response += `. ${advice.activities.join('. ')}`;
  }
  
  if (query.match(/risk|warning|danger|safe/i)) {
    response += advice.warnings.length ? `. ${advice.warnings.join('. ')}` : '. No significant weather risks identified';
  }
  
  // Add important recommendations if any
  if (advice.recommendations.length > 0) {
    response += `\n\nRecommendations: ${advice.recommendations.join('. ')}`;
  }
  
  return response;
}