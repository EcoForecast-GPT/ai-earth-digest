# WeatherGPT 🌦️⚡

Advanced weather intelligence powered by NASA data and Gemini AI with a futuristic 2030-era interface.

## 🚀 Features

- **Interactive Weather Dashboard**: Futuristic glass-morphism interface with smooth animations
- **NASA Data Integration Ready**: Structured for GES DISC, Giovanni, Worldview, and Earthdata Search APIs
- **AI-Powered Insights**: Gemini AI integration for weather summaries and recommendations
- **Time-Series Visualization**: Advanced charting with custom annotations
- **Interactive Maps**: Click-to-select location with satellite imagery overlay
- **Real-time Data Processing**: Mock implementation ready for live NASA API integration

## 🎨 Design System

**Color Palette:**
- Deep space backgrounds with aurora-like gradients
- Cyan primary (#00FFFF) for interactive elements
- Green accent (#00FF7F) for highlights
- Purple secondary (#6A5ACD) for depth

**Animations:**
- Pulse glow effects for data indicators
- Floating animations for cards
- Data stream effects for real-time feel
- Aurora gradients with smooth transitions

## 🏗️ Architecture

### Frontend (Current Implementation)
- **React + TypeScript**: Type-safe component architecture
- **Tailwind CSS**: Custom design system with glass-morphism
- **Custom Hooks**: State management for weather data
- **Responsive Design**: Mobile-first approach with grid layouts

### Backend Integration (Ready for Implementation)

**API Endpoint Structure:**
```
GET /api/weather?lat={lat}&lon={lon}&start={start}&end={end}&vars={vars}
```

**Response Format:**
```json
{
  "location": { "lat": 40.7128, "lon": -74.0060, "name": "New York City" },
  "dateRange": { "start": "2024-01-01", "end": "2024-01-31" },
  "data": [
    {
      "timestamp": "2024-01-01T00:00:00Z",
      "temperature": 22.5,
      "precipitation": 12.3,
      "humidity": 68.2,
      "windSpeed": 8.1
    }
  ],
  "aiSummary": {
    "summary": "Weather analysis shows...",
    "insights": ["Temperature variance suggests...", "..."],
    "recommendations": ["Monitor heat stress...", "..."]
  }
}
```

## 🔧 Setup Instructions

### Prerequisites
- Node.js 18+ and npm
- Environment variables for API keys (production)

### Installation
```bash
# Clone the repository
git clone <repo-url>
cd weathergpt

# Install dependencies
npm install

# Start development server
npm run dev
```

### Environment Variables (Production)
```bash
# .env (backend only - never expose on client)
GEMINI_API_KEY=your_gemini_api_key
NASA_EARTHDATA_USERNAME=your_username
NASA_EARTHDATA_PASSWORD=your_password
MAPBOX_ACCESS_TOKEN=your_mapbox_token
```

## 🌐 NASA Data Sources Integration

### 1. GES DISC (Goddard Earth Sciences Data and Information Services Center)
- **Purpose**: Atmospheric data, precipitation, temperature
- **Endpoint**: `https://disc.gsfc.nasa.gov/api/`
- **Authentication**: Earthdata credentials

### 2. Giovanni (GES DISC Interactive Online Visualization ANd aNalysis Infrastructure)
- **Purpose**: Satellite data visualization and analysis
- **Endpoint**: `https://giovanni.gsfc.nasa.gov/giovanni/`
- **Format**: NetCDF, HDF5

### 3. Worldview
- **Purpose**: Satellite imagery and layers
- **Endpoint**: `https://worldview.earthdata.nasa.gov/api/`
- **Real-time**: True color and false color imagery

### 4. Earthdata Search
- **Purpose**: Dataset discovery and download
- **Endpoint**: `https://search.earthdata.nasa.gov/api/`
- **Granules**: Individual data files

## 🤖 Gemini AI Integration

### Implementation Example
```typescript
// Backend API route (Next.js/Express)
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export async function generateWeatherSummary(weatherData: WeatherData[]) {
  const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
  
  const prompt = `
    Analyze this weather data and provide:
    1. A brief summary (2-3 sentences)
    2. Three key insights
    3. Three recommendations
    
    Data: ${JSON.stringify(weatherData)}
  `;
  
  const result = await model.generateContent(prompt);
  return result.response.text();
}
```

## 🧪 Testing

### Test Structure
```bash
# Unit tests
npm run test:unit

# Integration tests  
npm run test:integration

# E2E tests
npm run test:e2e
```

### Acceptance Criteria
- ✅ Normalized time-series JSON response
- ✅ Gemini AI summary endpoint
- ✅ Interactive charts and imagery
- ✅ No client-side API key exposure
- ✅ Responsive design across devices

## 🚀 Deployment

### Frontend Deployment (Lovable/Vercel)
```bash
npm run build
npm run deploy
```

### Backend Options

#### Option 1: Supabase Edge Functions
```sql
-- Create weather_data table
CREATE TABLE weather_data (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  location JSONB NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL,
  data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### Option 2: Next.js API Routes
```bash
# Deploy to Vercel
vercel --prod

# Environment variables in dashboard:
# GEMINI_API_KEY
# NASA_EARTHDATA_USERNAME  
# NASA_EARTHDATA_PASSWORD
```

## 🔒 Security Considerations

- **API Keys**: Server-side only, never in client code
- **Rate Limiting**: Implement for NASA and Gemini APIs
- **Input Validation**: Sanitize lat/lon and date parameters
- **CORS**: Configure for production domains only
- **Authentication**: Consider user auth for premium features

## 📊 Current Limitations & Next Steps

### Current Implementation (MVP)
- ✅ Futuristic UI with glass-morphism design
- ✅ Mock weather data and AI responses
- ✅ Interactive location selection
- ✅ Time-series chart visualization
- ✅ Responsive design system

### Production Requirements
- 🔄 NASA API integration (requires backend)
- 🔄 Real Gemini AI calls (requires API key)
- 🔄 Mapbox integration for real maps
- 🔄 User authentication system
- 🔄 Data caching and optimization
- 🔄 Error handling and monitoring

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- NASA for providing open weather data APIs
- Google for Gemini AI integration
- Shadcn/ui for component foundation
- Tailwind CSS for styling system

---

**Note**: This is a frontend implementation ready for backend integration. The current version uses mock data to demonstrate the full user experience. To deploy with real NASA data and AI capabilities, implement the backend services using the API structures provided above.