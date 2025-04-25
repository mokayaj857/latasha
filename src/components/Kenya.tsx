import React, { useState, useEffect, JSX } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar,
  AlertTriangle,
  Layers,
  Leaf,
  Droplets,
  Info,
  Bug,
  Activity,
  Shield,
  Cloud,
  Sun,
  CloudRain,
  CloudSnow,
  CloudFog,
  CloudLightning
} from 'lucide-react';

// Types
interface WeatherData {
  weather: {
    id: number;
    main: string;
    description: string;
    icon: string;
  }[];
  main: {
    temp: number;
    feels_like: number;
    temp_min: number;
    temp_max: number;
    humidity: number;
  };
  wind: {
    speed: number;
    deg: number;
  };
  rain?: {
    '1h': number;
  };
  snow?: {
    '1h': number;
  };
  dt: number;
  name: string;
}

interface ForecastData {
  list: {
    dt: number;
    main: {
      temp: number;
      temp_min: number;
      temp_max: number;
      humidity: number;
    };
    weather: {
      id: number;
      main: string;
      description: string;
      icon: string;
    }[];
    wind: {
      speed: number;
    };
    rain?: {
      '3h': number;
    };
    snow?: {
      '3h': number;
    };
    dt_txt: string;
  }[];
}

interface SoilType {
  [key: string]: {
    name: string;
    waterRetention: 'High' | 'Medium' | 'Low';
    phLevel: string;
    characteristics: string[];
  };
}

// Constants
const API_KEY = 'f0bb40f2b7926ef137fa37dd1170ea84'; // Replace with your actual API key
const KERICHO_COORDS = { lat: -0.3670, lon: 35.2831 }; // Kericho, Kenya coordinates

const WeatherIcon = ({ code, size }: { code: string; size: number }) => {
  const iconMap: { [key: string]: JSX.Element } = {
    '01d': <Sun size={size} className="text-yellow-500" />,
    '01n': <Sun size={size} className="text-yellow-300" />,
    '02d': <Cloud size={size} className="text-gray-400" />,
    '02n': <Cloud size={size} className="text-gray-300" />,
    '03d': <Cloud size={size} className="text-gray-500" />,
    '03n': <Cloud size={size} className="text-gray-400" />,
    '04d': <Cloud size={size} className="text-gray-600" />,
    '04n': <Cloud size={size} className="text-gray-500" />,
    '09d': <CloudRain size={size} className="text-blue-500" />,
    '09n': <CloudRain size={size} className="text-blue-400" />,
    '10d': <CloudRain size={size} className="text-blue-600" />,
    '10n': <CloudRain size={size} className="text-blue-500" />,
    '11d': <CloudLightning size={size} className="text-purple-600" />,
    '11n': <CloudLightning size={size} className="text-purple-500" />,
    '13d': <CloudSnow size={size} className="text-blue-200" />,
    '13n': <CloudSnow size={size} className="text-blue-100" />,
    '50d': <CloudFog size={size} className="text-gray-300" />,
    '50n': <CloudFog size={size} className="text-gray-200" />,
  };

  return iconMap[code] || <Cloud size={size} />;
};

const getSeason = (month: number): string => {
  // Kenya seasons for Kericho region
  if (month >= 3 && month <= 5) return 'Long Rains Season';
  if (month >= 6 && month <= 8) return 'Cool Dry Season';
  if (month >= 9 && month <= 11) return 'Short Rains Season';
  return 'Dry Season';
};

const Dashboard = () => {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [forecast, setForecast] = useState<ForecastData | null>(null);
  const [selectedSoil, setSelectedSoil] = useState('clay');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const soilTypes: SoilType = {
    clay: {
      name: 'Clay',
      waterRetention: 'High',
      phLevel: '5.5-7.0',
      characteristics: ['Heavy texture', 'Slow drainage', 'High nutrient retention']
    },
    loam: {
      name: 'Loam',
      waterRetention: 'Medium',
      phLevel: '6.0-7.0',
      characteristics: ['Balanced texture', 'Good drainage', 'Moderate nutrient retention']
    },
    sandy: {
      name: 'Sandy',
      waterRetention: 'Low',
      phLevel: '5.5-6.5',
      characteristics: ['Light texture', 'Fast drainage', 'Low nutrient retention']
    }
  };

  useEffect(() => {
    const fetchWeatherData = async () => {
      try {
        setLoading(true);
        
        // Fetch current weather
        const weatherResponse = await fetch(
          `https://api.openweathermap.org/data/2.5/weather?lat=${KERICHO_COORDS.lat}&lon=${KERICHO_COORDS.lon}&appid=${API_KEY}&units=metric`
        );
        
        if (!weatherResponse.ok) throw new Error('Failed to fetch weather data');
        const weatherData = await weatherResponse.json();
        
        // Fetch 5-day forecast
        const forecastResponse = await fetch(
          `https://api.openweathermap.org/data/2.5/forecast?lat=${KERICHO_COORDS.lat}&lon=${KERICHO_COORDS.lon}&appid=${API_KEY}&units=metric`
        );
        
        if (!forecastResponse.ok) throw new Error('Failed to fetch forecast data');
        const forecastData = await forecastResponse.json();
        
        setWeather(weatherData);
        setForecast(forecastData);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchWeatherData();
  }, []);

  const getCropRecommendations = () => {
    if (!weather) return [];
    
    const season = getSeason(new Date().getMonth());
    const temp = weather.main.temp;
    const rainfall = weather.rain?.['1h'] || weather.snow?.['1h'] || 0;

    // Crop recommendations based on current weather and season
    if (season.includes('Long Rains')) {
      return [
        { name: "Tea", icon: "🌱", description: "Ideal for current rainy conditions", confidence: 92 },
        { name: "Maize", icon: "🌽", description: "Plant now for main growing season", confidence: 88 },
        { name: "Beans", icon: "🫘", description: "Good intercropping with maize", confidence: 85 }
      ];
    } else if (season.includes('Short Rains')) {
      return [
        { name: "Fast-maturing Maize", icon: "🌽", description: "Quick growth varieties", confidence: 85 },
        { name: "Vegetables", icon: "🥬", description: "Kale, spinach, cabbages", confidence: 90 },
        { name: "Beans", icon: "🫘", description: "Short season varieties", confidence: 88 }
      ];
    } else if (temp > 25) {
      return [
        { name: "Sorghum", icon: "🌾", description: "Drought resistant grain", confidence: 82 },
        { name: "Millet", icon: "🌾", description: "Heat tolerant crop", confidence: 85 },
        { name: "Drought-resistant Veg", icon: "🥬", description: "Amaranth, cowpeas", confidence: 78 }
      ];
    } else {
      return [
        { name: "Irish Potatoes", icon: "🥔", description: "Cool weather crop", confidence: 80 },
        { name: "Cabbages", icon: "🥬", description: "Thrives in cooler temps", confidence: 85 },
        { name: "Kale", icon: "🥬", description: "Cold tolerant greens", confidence: 88 }
      ];
    }
  };

  const getFarmActivities = () => {
    if (!weather) return [];
    
    const rain = weather.rain?.['1h'] || 0;
    const windSpeed = weather.wind.speed;
    const activities = [];

    if (rain > 10) {
      activities.push({
        activity: "Drainage Management",
        description: "Ensure proper drainage to prevent waterlogging",
        priority: "High"
      });
    } else if (rain < 2 && weather.main.humidity < 60) {
      activities.push({
        activity: "Irrigation",
        description: "Water crops to maintain soil moisture",
        priority: "High"
      });
    }

    if (windSpeed > 5) {
      activities.push({
        activity: "Wind Protection",
        description: "Secure young plants and structures",
        priority: "Medium"
      });
    }

    activities.push(
      {
        activity: "Soil Testing",
        description: "Check nutrient levels before planting",
        priority: "Medium"
      },
      {
        activity: "Pest Monitoring",
        description: "Set traps for common seasonal pests",
        priority: "Low"
      }
    );

    return activities;
  };

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex justify-center items-center h-screen"
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full"
        />
      </motion.div>
    );
  }

  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex justify-center items-center h-screen"
      >
        <div className="bg-red-100 border-l-4 border-red-500 p-4 max-w-md">
          <div className="flex items-center">
            <AlertTriangle className="text-red-500 mr-2" />
            <h3 className="font-bold text-red-800">Error Loading Data</h3>
          </div>
          <p className="text-red-700 mt-2">{error}</p>
        </div>
      </motion.div>
    );
  }

  if (!weather || !forecast) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="bg-yellow-100 border-l-4 border-yellow-500 p-4 max-w-md">
          <div className="flex items-center">
            <Info className="text-yellow-500 mr-2" />
            <h3 className="font-bold text-yellow-800">No Weather Data</h3>
          </div>
          <p className="text-yellow-700 mt-2">Unable to retrieve weather information</p>
        </div>
      </div>
    );
  }

  // Process forecast data for 5-day display
  const dailyForecast = forecast.list.reduce((acc: any[], item) => {
    const date = new Date(item.dt * 1000);
    const day = date.toLocaleDateString('en-US', { weekday: 'short' });
    
    // Group by day and calculate min/max temps
    const existingDay = acc.find(d => d.day === day);
    if (existingDay) {
      existingDay.temp_min = Math.min(existingDay.temp_min, item.main.temp_min);
      existingDay.temp_max = Math.max(existingDay.temp_max, item.main.temp_max);
      existingDay.rain = (existingDay.rain || 0) + (item.rain?.['3h'] || item.snow?.['3h'] || 0);
    } else if (acc.length < 5) {
      acc.push({
        day,
        icon: item.weather[0].icon,
        temp: item.main.temp,
        temp_min: item.main.temp_min,
        temp_max: item.main.temp_max,
        rain: item.rain?.['3h'] || item.snow?.['3h'] || 0
      });
    }
    return acc;
  }, []);

  const currentSeason = getSeason(new Date().getMonth());

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl bg-gradient-to-br from-blue-50 to-green-50 min-h-screen">
      {/* Weather Overview Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-white rounded-xl shadow-lg p-6 mb-8 backdrop-blur-sm bg-white/70"
      >
        <div className="flex flex-col md:flex-row gap-6">
          {/* Current Weather */}
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
              <motion.span
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 3, repeat: Infinity }}
                className="mr-2"
              >
                <WeatherIcon code={weather.weather[0].icon} size={24} />
              </motion.span>
              Current Weather in {weather.name}
            </h2>
            
            <div className="flex items-center justify-center flex-col">
              <motion.div
                animate={{ 
                  scale: [1, 1.05, 1],
                  rotate: [0, 5, -5, 0]
                }}
                transition={{ duration: 8, repeat: Infinity }}
              >
                <WeatherIcon code={weather.weather[0].icon} size={96} />
              </motion.div>
              
              <motion.div 
                className="mt-3 font-semibold text-2xl text-gray-800 flex items-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                {Math.round(weather.main.temp)}°C
                <span className="ml-2 text-sm text-gray-500">
                  (Feels like {Math.round(weather.main.feels_like)}°C)
                </span>
              </motion.div>
              
              <motion.div 
                className="mt-1 text-lg text-gray-600 capitalize"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                {weather.weather[0].description}
              </motion.div>
              
              <motion.div 
                className="text-sm text-gray-600 font-medium py-1 px-3 bg-blue-50 rounded-full inline-block mt-2 flex items-center"
                whileHover={{ y: -2 }}
              >
                <Calendar size={14} className="mr-1" />
                {currentSeason}
              </motion.div>
              
              <div className="flex gap-4 mt-3">
                <motion.div 
                  className="text-center"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  <div className="flex items-center text-gray-600">
                    <Droplets size={14} className="mr-1" />
                    <span>Humidity</span>
                  </div>
                  <div className="font-semibold">{weather.main.humidity}%</div>
                </motion.div>
                
                <motion.div 
                  className="text-center"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                >
                  <div className="flex items-center text-gray-600">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="mr-1">
                      <path d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M5.636 5.636l3.536 3.536m0 5.656l-3.536 3.536M12 12v8m0-16v2m-9 7h2m16 0h2m-9-9l-2 2m4-4l-2 2m4-4l-2 2" />
                    </svg>
                    <span>Wind</span>
                  </div>
                  <div className="font-semibold">{weather.wind.speed} m/s</div>
                </motion.div>
                
                <motion.div 
                  className="text-center"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.7 }}
                >
                  <div className="flex items-center text-gray-600">
                    <CloudRain size={14} className="mr-1" />
                    <span>Rain</span>
                  </div>
                  <div className="font-semibold">
                    {weather.rain?.['1h']?.toFixed(1) || weather.snow?.['1h']?.toFixed(1) || 0} mm
                  </div>
                </motion.div>
              </div>
            </div>
          </div>

          {/* 5-day forecast */}
          <div className="flex-1 mt-6 md:mt-0">
            <h3 className="text-md font-semibold text-gray-700 mb-3 flex items-center">
              <Calendar className="mr-2 text-blue-600" size={18} />
              5-Day Weather Forecast
            </h3>
            <div className="flex overflow-x-auto pb-2 gap-3">
              {dailyForecast.map((day, index) => (
                <motion.div 
                  key={index} 
                  className="flex flex-col items-center p-3 bg-gradient-to-b from-blue-50 to-green-50 rounded-lg min-w-[100px] shadow-sm hover:shadow-md transition-shadow"
                  whileHover={{ 
                    y: -5, 
                    boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)" 
                  }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * index }}
                >
                  <span className="text-sm font-medium text-gray-700 mb-1">{day.day}</span>
                  <WeatherIcon code={day.icon} size={32} />
                  <div className="flex items-center mt-1">
                    <span className="text-xs text-blue-600 mr-1">{Math.round(day.temp_min)}°</span>
                    <span className="font-medium">{Math.round(day.temp)}°</span>
                    <span className="text-xs text-red-500 ml-1">{Math.round(day.temp_max)}°</span>
                  </div>
                  <span className="text-xs text-blue-600 mt-1 flex items-center">
                    <Droplets size={10} className="mr-1" />
                    {day.rain.toFixed(1)} mm
                  </span>
                </motion.div>
              ))}
            </div>
            
            {/* Rainfall Trend Chart */}
            <div className="mt-6 pt-4 border-t border-gray-100">
              <h3 className="text-md font-semibold text-gray-700 mb-3 flex items-center">
                <Droplets className="mr-2 text-blue-600" size={18} />
                Rainfall Trend
              </h3>
              <div className="h-24 flex items-end gap-1">
                {dailyForecast.map((day, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center">
                    <motion.div 
                      className="w-full bg-gradient-to-t from-blue-400 to-blue-600 rounded-t"
                      style={{ opacity: 0.6 + (i * 0.08) }}
                      initial={{ height: 0 }}
                      animate={{ height: `${Math.min(100, day.rain * 10)}%` }}
                      transition={{ duration: 1, delay: 0.2 * i }}
                    />
                    <span className="text-xs mt-1">{day.day.substring(0, 3)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Soil & Crops Section */}
      <motion.div 
        initial={{ x: 30, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.4 }}
        className="bg-white rounded-xl shadow-lg p-6 mb-8 backdrop-blur-sm bg-white/70"
      >
        <h2 className="text-xl font-bold mb-4 text-gray-800 flex items-center">
          <Layers className="mr-2 text-amber-600" size={24} />
          Soil Type & Crop Recommendations
        </h2>
        
        <div className="mb-5">
          <label className="block text-gray-700 mb-2 font-medium">Select your soil type:</label>
          <div className="flex flex-wrap gap-2">
            {Object.keys(soilTypes).map(soil => (
              <motion.button
                key={soil}
                className={`px-4 py-2 rounded-full transition-colors duration-300 shadow-sm ${
                  selectedSoil === soil 
                    ? 'bg-gradient-to-r from-green-600 to-green-500 text-white font-medium shadow-md' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                onClick={() => setSelectedSoil(soil)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {soilTypes[soil].name}
              </motion.button>
            ))}
          </div>
        </div>
        
        {/* Soil Characteristics */}
        <motion.div 
          className="mb-5 bg-gradient-to-r from-amber-50 to-green-50 p-4 rounded-lg shadow-sm border border-green-100"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <h3 className="font-medium text-gray-800 mb-3 flex items-center">
            <Layers size={16} className="mr-2 text-amber-600" />
            Soil Characteristics:
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center mb-2">
                <span className="text-gray-700 w-1/3">Type:</span>
                <span className="ml-2 font-medium">{soilTypes[selectedSoil].name}</span>
              </div>
              <div className="flex items-center mb-2">
                <span className="text-gray-700 w-1/3">Water Retention:</span>
                <span className="ml-2 font-medium">{soilTypes[selectedSoil].waterRetention}</span>
              </div>
              <div className="flex items-center">
                <span className="text-gray-700 w-1/3">pH Level:</span>
                <span className="ml-2 font-medium">{soilTypes[selectedSoil].phLevel}</span>
              </div>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-1">Key Characteristics:</h4>
              <div className="flex flex-wrap gap-2">
                {soilTypes[selectedSoil].characteristics.map((char, idx) => (
                  <motion.span 
                    key={idx}
                    className="px-2 py-1 bg-white bg-opacity-60 rounded-full text-xs shadow-sm"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 * idx }}
                  >
                    {char}
                  </motion.span>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
        
        {/* Recommended Crops */}
        <div>
          <h3 className="font-medium text-gray-800 mb-3 flex items-center">
            <Leaf size={16} className="mr-2 text-green-600" />
            Recommended Crops:
          </h3>
          <div className="space-y-3">
            <AnimatePresence>
              {getCropRecommendations().map((crop, index) => (
                <motion.div 
                  key={crop.name}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-gradient-to-r from-green-50 to-blue-50 p-3 rounded-lg shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between hover:shadow-md transition-shadow duration-300 border border-green-100"
                >
                  <div className="flex items-center mb-2 sm:mb-0">
                    <motion.span 
                      className="text-2xl mr-3"
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ repeat: Infinity, duration: 2, delay: index * 0.3 }}
                    >
                      {crop.icon}
                    </motion.span>
                    <div>
                      <span className="font-medium text-gray-800">{crop.name}</span>
                      <p className="text-xs text-gray-600 mt-1">{crop.description}</p>
                    </div>
                  </div>
                  <div className="text-sm">
                    <motion.span 
                      className={`px-3 py-1 rounded-full ${
                        crop.confidence > 90 
                          ? 'bg-green-200 text-green-800' 
                          : crop.confidence > 80 
                          ? 'bg-blue-200 text-blue-800' 
                          : 'bg-yellow-200 text-yellow-800'
                      }`}
                      whileHover={{ scale: 1.05 }}
                    >
                      {crop.confidence}% match
                    </motion.span>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>

      {/* Farm Activities Section */}
      <motion.div 
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.6 }}
        className="bg-white rounded-xl shadow-lg p-6 mb-8 backdrop-blur-sm bg-white/70"
      >
        <h2 className="text-xl font-bold mb-4 text-gray-800 flex items-center">
          <Calendar className="mr-2 text-green-600" size={24} />
          Recommended Farm Activities
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <AnimatePresence>
            {getFarmActivities().map((activity, index) => (
              <motion.div 
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index * 0.1 }}
                className={`p-4 rounded-lg flex items-start transition-all duration-300 hover:shadow-md ${
                  activity.priority === 'High' 
                    ? 'bg-gradient-to-r from-red-50 to-red-100 border-l-4 border-red-400' 
                    : activity.priority === 'Medium'
                    ? 'bg-gradient-to-r from-yellow-50 to-amber-100 border-l-4 border-yellow-400'
                    : 'bg-gradient-to-r from-blue-50 to-blue-100 border-l-4 border-blue-400'
                }`}
                whileHover={{ x: 5 }}
              >
                <div className="flex-1">
                  <div className="font-medium text-gray-800">{activity.activity}</div>
                  <div className="text-sm text-gray-600 mt-1">{activity.description}</div>
                  <div className="text-xs mt-2">
                    <span className={`inline-block px-2 py-1 rounded-full ${
                      activity.priority === 'High' 
                        ? 'bg-red-200 text-red-800' 
                        : activity.priority === 'Medium'
                        ? 'bg-yellow-200 text-yellow-800'
                        : 'bg-blue-200 text-blue-800'
                    }`}>
                      {activity.priority} Priority
                    </span>
                  </div>
                </div>
                {activity.priority === 'High' && (
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                  >
                    <AlertTriangle className="text-red-500 ml-2" size={20} />
                  </motion.div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Weather Advisory */}
      <motion.div 
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.8 }}
        className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl shadow-lg p-6 mb-8 border border-blue-200 backdrop-blur-sm"
      >
        <h2 className="text-lg font-bold mb-3 text-blue-800 flex items-center">
          <AlertTriangle className="mr-2 text-blue-600" size={20} />
          Weather Advisory Note
        </h2>
        
        <motion.p 
          className="text-gray-700"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 }}
        >
          <strong className="text-blue-700">Current Status:</strong>{" "}
          {((weather?.rain && weather.rain['1h']) || 0) > 15 
            ? "Heavy rainfall is occurring in Kericho County. Ensure proper drainage systems are in place to prevent waterlogging and soil erosion. Monitor crops for signs of disease due to high humidity."
            : (weather.rain?.['1h'] ?? 0) > 5 
            ? "Moderate rainfall provides optimal growing conditions. Take advantage of these conditions for planting and fertilizer application. Weeding is recommended now as soil moisture makes it easier."
            : "Low rainfall conditions are present. Implement water conservation techniques including mulching and careful irrigation scheduling. Monitor crops for signs of water stress."}
        </motion.p>
        
        <motion.div 
          className="mt-4 p-3 bg-white bg-opacity-60 rounded-lg"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1 }}
        >
          <strong className="text-blue-700">Forecast Implications:</strong>{" "}
          {dailyForecast[1]?.rain > (weather.rain?.['1h'] || 0) * 1.5
            ? "Rainfall is expected to increase significantly. Prepare drainage channels and consider delaying fertilizer application until after heavy rains pass."
            : dailyForecast[1]?.rain < (weather.rain?.['1h'] || 1) * 0.5
            ? "Rainfall is expected to decrease. Plan irrigation accordingly and consider applying mulch to conserve soil moisture."
            : "Rainfall patterns are expected to remain stable. Continue with regular farming activities appropriate for current conditions."
          }
        </motion.div>
      </motion.div>

      {/* Footer */}
      <motion.footer 
        className="text-center text-sm text-gray-500 mt-8 pb-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
      >
        <p>Agricultural Advisory Dashboard for Kericho County</p>
        <p className="mt-1">Data updated: {new Date(weather.dt * 1000).toLocaleString()}</p>
      </motion.footer>
    </div>
  );
};

export default Dashboard;