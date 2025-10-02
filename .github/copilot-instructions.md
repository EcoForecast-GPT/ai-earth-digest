# AI Coding Agent Instructions for `ai-earth-digest`

## Project Overview
`ai-earth-digest` is a weather forecasting platform leveraging real-time data and AI-powered insights. The application integrates NASA weather data, provides interactive visualizations, and includes AI-driven summaries and recommendations for users.

### Key Components
- **Frontend**: Built with React and TypeScript, styled using TailwindCSS.
- **Backend**: Supabase functions for serverless operations, such as fetching weather data.
- **Data Sources**: NASA POWER API and Open-Meteo API for weather data.
- **UI Components**: Modular and reusable components located in `src/components/ui`.
- **AI Features**: Includes a chatbot (`WeatherChatbot.tsx`) and AI summary cards (`AISummaryCard.tsx`).

## Developer Workflows
### Build and Run
- Install dependencies:
  ```bash
  npm install
  ```
- Start the development server:
  ```bash
  npm run dev
  ```
- Build for production:
  ```bash
  npm run build
  ```

### Testing
- Currently, no explicit test framework is configured. Add tests as needed.

### Debugging
- Use the browser's developer tools for frontend debugging.
- Supabase logs can be accessed via the Supabase dashboard for backend debugging.

## Project-Specific Conventions
### Code Style
- Follow ESLint rules defined in `eslint.config.js`.
- Use TypeScript for type safety.

### Component Design
- Components are modular and reusable.
- UI components are located in `src/components/ui`.
- Use TailwindCSS for styling.

### Data Flow
- Weather data is fetched via Supabase functions and passed to React components.
- State management is handled locally within components or via hooks.

### Animations
- Animations are implemented using `framer-motion`.
- Example: `src/components/WeatherBackground.tsx` for dynamic weather effects.

### File Naming
- Use PascalCase for component files (e.g., `WeatherChatbot.tsx`).
- Use kebab-case for non-TypeScript files (e.g., `index.css`).

## Integration Points
- **Supabase**: Configure in `supabase/config.toml`.
- **NASA POWER API**: Used in `src/services/nasaWeatherService.ts`.
- **Open-Meteo API**: Used in `supabase/functions/get-weather/index.ts`.

## Examples
### Adding a New Component
1. Create the component in `src/components`.
2. Export it from the appropriate `index.ts` file.
3. Use TailwindCSS for styling.

### Fetching Data
- Example: `src/services/nasaWeatherService.ts`:
  ```ts
  export const fetchNASAWeatherData = async (lat: number, lon: number) => {
    const response = await fetch(`https://power.larc.nasa.gov/api/...`);
    return await response.json();
  };
  ```

### Adding Animations
- Example: `src/components/WeatherBackground.tsx`:
  ```tsx
  <motion.div
    animate={{ opacity: [0, 1, 0] }}
    transition={{ duration: 2, repeat: Infinity }}
  />
  ```

## Notes
- Ensure all new components are responsive and accessible.
- Follow the existing folder structure and naming conventions.
- Document any new APIs or services integrated.