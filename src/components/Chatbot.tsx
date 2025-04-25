import React, { useState, useEffect, useCallback } from 'react';
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
  CloudLightning,
  RefreshCw
} from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

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
    pressure: number;
  };
  wind: {
    speed: number;
    deg: number;
    gust?: number;
  };
  rain?: {
    '1h': number;
  };
  snow?: {
    '1h': number;
  };
  dt: number;
  name: string;
  sys: {
    country: string;
    sunrise: number;
    sunset: number;
  };
}

interface ForecastData {
  list: {
    dt: number;
    main: {
      temp: number;
      temp_min: number;
      temp_max: number;
      humidity: number;
      pressure: number;
    };
    weather: {
      id: number;
      main: string;
      description: string;
      icon: string;
    }[];
    wind: {
      speed: number;
      deg: number;
      gust?: number;
    };
    rain?: {
      '3h': number;
    };
    snow?: {
      '3h': number;
    };
    dt_txt: string;
  }[];
  city: {
    name: string;
    coord: {
      lat: number;
      lon: number;
    };
  };
}

interface SoilData {
  properties: {
    BLD: number; // Bulk density (kg/dm³)
    CEC: number; // Cation Exchange Capacity (cmolc/kg)
    CLYPPT: number; // Clay content (%)
    ORCDRC: number; // Organic carbon (g/kg)
    PHIHOX: number; // pH index
    SLTPPT: number; // Silt content (%)
    SNDPPT: number; // Sand content (%)
    WWP: number; // Water content at wilting point (cm³/cm³)
    classification: string;
    fertility: string;
    color: string;
  };
}

// Constants
const API_KEY = 'YOUR_OPENWEATHER_API_KEY'; // Replace with your actual API key
const KERICHO_COORDS = { lat: -0.3670, lon: 35.2831 }; // Kericho, Kenya coordinates

// Creative dummy soil data for Kericho region
const DUMMY_SOIL_DATA: SoilData = {
  properties: {
    BLD: 1.25, // Moderate bulk density
    CEC: 12.5, // Moderate cation exchange capacity
    CLYPPT: 42.3, // High clay content
    ORCDRC: 28.7, // High organic carbon (volcanic soils)
    PHIHOX: 5.8, // Slightly acidic
    SLTPPT: 23.1, // Moderate silt
    SNDPPT: 34.6, // Moderate sand
    WWP: 0.18, // Good water retention
    classification: "Andisols (Volcanic)",
    fertility: "High",
    color: "Dark Brown"
  }
};

const WeatherIcon = ({ code, size }: { code: string; size: number }) => {
  const iconMap: { [key: string]: JSX.Element } = {
    '01d': <Sun size={size} className="text-yellow-500 animate-pulse" />,
    '01n': <Sun size={size} className="text-yellow-300" />,
    '02d': <Cloud size={size} className="text-gray-400" />,
    '02n': <Cloud size={size} className="text-gray-300" />,
    '03d': <Cloud size={size} className="text-gray-500" />,
    '03n': <Cloud size={size} className="text-gray-400" />,
    '04d': <Cloud size={size} className="text-gray-600" />,
    '04n': <Cloud size={size} className="text-gray-500" />,
    '09d': <CloudRain size={size} className="text-blue-500" />,
    '09n': <CloudRain size={size} className="text-blue-400" />,
    '10d': <CloudRain size={size} className="text-blue-600 animate-bounce" />,
    '10n': <CloudRain size={size} className="text-blue-500" />,
    '11d': <CloudLightning size={size} className="text-purple-600 animate-flash" />,
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
  if (month >= 3 && month <= 5) return 'Long Rains Season 🌧️';
  if (month >= 6 && month <= 8) return 'Cool Dry Season ❄️';
  if (month >= 9 && month <= 11) return 'Short Rains Season 🌦️';
  return 'Dry Season ☀️';
};

const getSoilType = (clay: number, sand: number): string => {
  if (clay > 35) return 'clay';
  if (sand > 70) return 'sandy';
  return 'loam';
};

const Dashboard = () => {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [forecast, setForecast] = useState<ForecastData | null>(null);
  const [soilData, setSoilData] = useState<SoilData>(DUMMY_SOIL_DATA);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string>('');
  const [refreshing, setRefreshing] = useState(false);

  const selectedSoil = getSoilType(soilData.properties.CLYPPT, soilData.properties.SNDPPT);

  const fetchWeatherData = useCallback(async () => {
    try {
      setRefreshing(true);
      const startTime = Date.now();
      
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
      setLastUpdated(new Date().toLocaleTimeString());
      
      // Ensure minimum loading time for better UX
      const elapsed = Date.now() - startTime;
      if (elapsed < 1000) {
        await new Promise(resolve => setTimeout(resolve, 1000 - elapsed));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchWeatherData();
    
    // Set up auto-refresh every 5 minutes
    const interval = setInterval(fetchWeatherData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchWeatherData]);

  // Initialize map with soil data
  useEffect(() => {
    const map = L.map('soil-map').setView([KERICHO_COORDS.lat, KERICHO_COORDS.lon], 12);
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    // Add soil data markers with creative popup
    const popupContent = `
      <div class="text-sm">
        <h3 class="font-bold">🌱 Kericho Soil Profile</h3>
        <div class="mt-2 p-2 rounded" style="background-color: #8B4513; color: white;">
          <strong>Classification:</strong> ${soilData.properties.classification}<br>
          <strong>Color:</strong> ${soilData.properties.color}<br>
          <strong>Fertility:</strong> ${soilData.properties.fertility}
        </div>
        <div class="mt-2 grid grid-cols-2 gap-1">
          <div class="bg-gray-100 p-1 rounded">
            <strong>Clay:</strong> ${soilData.properties.CLYPPT.toFixed(1)}%
          </div>
          <div class="bg-gray-100 p-1 rounded">
            <strong>Sand:</strong> ${soilData.properties.SNDPPT.toFixed(1)}%
          </div>
          <div class="bg-gray-100 p-1 rounded">
            <strong>pH:</strong> ${soilData.properties.PHIHOX.toFixed(1)}
          </div>
          <div class="bg-gray-100 p-1 rounded">
            <strong>Organic C:</strong> ${soilData.properties.ORCDRC.toFixed(1)}g/kg
          </div>
        </div>
      </div>
    `;

    L.marker([KERICHO_COORDS.lat, KERICHO_COORDS.lon])
      .addTo(map)
      .bindPopup(popupContent)
      .openPopup();

    // Add a creative soil fertility heat layer
    const fertilityLayer = L.circle([KERICHO_COORDS.lat, KERICHO_COORDS.lon], {
      color: soilData.properties.fertility === "High" ? '#38A169' : '#D69E2E',
      fillColor: soilData.properties.fertility === "High" ? '#38A169' : '#D69E2E',
      fillOpacity: 0.5,
      radius: 500
    }).addTo(map);

    return () => {
      map.remove();
    };
  }, [soilData]);

  const getCropRecommendations = () => {
    if (!weather) return [];
    
    const season = getSeason(new Date().getMonth());
    const temp = weather.main.temp;
    const rainfall = weather.rain?.['1h'] || weather.snow?.['1h'] || 0;

    // Enhanced recommendations based on Kericho's volcanic soil
    if (season.includes('Long Rains')) {
      return [
        { 
          name: "Tea", 
          icon: "🍃", 
          description: "Thrives in Kericho's volcanic soils with high organic content", 
          confidence: 96,
          benefits: ["High market value", "Perennial crop", "Loves acidic soils"]
        },
        { 
          name: "Pyrethrum", 
          icon: "🌸", 
          description: "Traditional cash crop for this soil type", 
          confidence: 88,
          benefits: ["Natural pesticide", "Drought resistant", "High value"]
        },
        { 
          name: "Dairy Grass", 
          icon: "🌾", 
          description: "High yield fodder for dairy farming", 
          confidence: 92,
          benefits: ["High protein", "Fast growing", "Improves soil structure"]
        }
      ];
    } else if (season.includes('Short Rains')) {
      return [
        { 
          name: "Beans", 
          icon: "🫘", 
          description: "Nitrogen fixer for soil enrichment", 
          confidence: 85,
          benefits: ["Improves fertility", "Quick harvest", "Dual purpose"]
        },
        { 
          name: "Kale", 
          icon: "🥬", 
          description: "Cold tolerant nutritious green", 
          confidence: 90,
          benefits: ["High nutrition", "Continuous harvest", "Pest resistant"]
        }
      ];
    } else {
      return [
        { 
          name: "Sweet Potatoes", 
          icon: "🍠", 
          description: "Drought resistant and nutritious", 
          confidence: 82,
          benefits: ["Storage crop", "Versatile", "Improves soil"]
        }
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
        description: "Volcanic clay soils need good drainage during heavy rains",
        priority: "High",
        icon: "💧"
      });
    } else if (rain < 2 && weather.main.humidity < 60) {
      activities.push({
        activity: "Mulching",
        description: "Conserve moisture in organic-rich soils",
        priority: "High",
        icon: "🍂"
      });
    }

    if (soilData.properties.ORCDRC > 25) {
      activities.push({
        activity: "Compost Tea Application",
        description: "Boost microbial activity in fertile soils",
        priority: "Medium",
        icon: "🧪"
      });
    }

    activities.push(
      {
        activity: "Soil Testing",
        description: "Regular testing maintains soil health",
        priority: "Medium",
        icon: "🔬"
      },
      {
        activity: "Terrace Maintenance",
        description: "Prevent erosion on hilly tea plantations",
        priority: "High",
        icon: "⛰️"
      }
    );

    return activities;
  };

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex justify-center items-center h-screen bg-gradient-to-br from-green-50 to-blue-50"
      >
        <motion.div
          animate={{ 
            rotate: 360,
            scale: [1, 1.2, 1]
          }}
          transition={{ 
            duration: 2, 
            repeat: Infinity, 
            ease: "easeInOut" 
          }}
          className="flex flex-col items-center"
        >
          <Leaf className="text-green-500 w-16 h-16" />
          <motion.p
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="mt-4 text-green-700 font-medium"
          >
            Loading Agricultural Data...
          </motion.p>
        </motion.div>
      </motion.div>
    );
  }

  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex justify-center items-center h-screen bg-gradient-to-br from-red-50 to-pink-50"
      >
        <div className="bg-white p-6 rounded-xl shadow-lg max-w-md text-center">
          <AlertTriangle className="text-red-500 w-12 h-12 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-red-700 mb-2">Data Loading Error</h3>
          <p className="text-gray-700 mb-4">{error}</p>
          <motion.button
            onClick={fetchWeatherData}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="bg-green-500 text-white px-4 py-2 rounded-lg flex items-center mx-auto"
          >
            <RefreshCw className={`mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Try Again
          </motion.button>
        </div>
      </motion.div>
    );
  }

  if (!weather || !forecast) {
    return null;
  }

  // Process forecast data for 5-day display
  const dailyForecast = forecast.list.reduce((acc: any[], item) => {
    const date = new Date(item.dt * 1000);
    const day = date.toLocaleDateString('en-US', { weekday: 'short' });
    
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
      {/* Header with refresh button */}
      <motion.div 
        className="flex justify-between items-center mb-6"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-2xl font-bold text-green-800">
          Kericho Agricultural Dashboard
        </h1>
        <motion.button
          onClick={fetchWeatherData}
          whileHover={{ scale: 1.05, rotate: 15 }}
          whileTap={{ scale: 0.95 }}
          className="bg-white p-2 rounded-full shadow-md"
          disabled={refreshing}
        >
          <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
        </motion.button>
      </motion.div>

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
              <span className="text-sm text-gray-500 ml-auto">
                Last updated: {lastUpdated}
              </span>
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
                Rainfall Trend (Next 5 Days)
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
          Volcanic Soil Analysis & Crop Recommendations
          <span className="text-xs text-gray-500 ml-auto">
            Kericho's Fertile Volcanic Soil
          </span>
        </h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Soil Map */}
          <motion.div
            className="bg-gray-100 rounded-lg overflow-hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <div id="soil-map" className="h-64 z-0"></div>
            <div className="p-3 text-center text-sm text-gray-600">
              Soil composition at your location (Dummy data for demonstration)
            </div>
          </motion.div>
          
          {/* Soil Properties */}
          <motion.div
            className="bg-gradient-to-br from-amber-50 to-green-50 p-4 rounded-lg border border-green-100"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            <h3 className="font-medium text-gray-800 mb-3 flex items-center">
              <Activity size={16} className="mr-2 text-green-600" />
              Soil Properties
            </h3>
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-white/50 p-2 rounded">
                <div className="text-xs text-gray-500">Classification</div>
                <div className="font-bold">{soilData.properties.classification}</div>
              </div>
              <div className="bg-white/50 p-2 rounded">
                <div className="text-xs text-gray-500">Fertility</div>
                <div className="font-bold">{soilData.properties.fertility}</div>
              </div>
              <div className="bg-white/50 p-2 rounded">
                <div className="text-xs text-gray-500">Clay Content</div>
                <div className="font-bold">{soilData.properties.CLYPPT.toFixed(1)}%</div>
              </div>
              <div className="bg-white/50 p-2 rounded">
                <div className="text-xs text-gray-500">Organic Carbon</div>
                <div className="font-bold">{soilData.properties.ORCDRC.toFixed(1)}g/kg</div>
              </div>
              <div className="bg-white/50 p-2 rounded">
                <div className="text-xs text-gray-500">pH Level</div>
                <div className="font-bold">{soilData.properties.PHIHOX.toFixed(1)}</div>
              </div>
              <div className="bg-white/50 p-2 rounded">
                <div className="text-xs text-gray-500">Water Retention</div>
                <div className="font-bold">{(soilData.properties.WWP * 100).toFixed(1)}%</div>
              </div>
            </div>
          </motion.div>
          
          {/* Soil Type */}
          <motion.div
            className="bg-gradient-to-br from-blue-50 to-purple-50 p-4 rounded-lg border border-blue-100"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
          >
            <h3 className="font-medium text-gray-800 mb-3 flex items-center">
              <Layers size={16} className="mr-2 text-blue-600" />
              Soil Characteristics
            </h3>
            <motion.div
              className="p-4 rounded-lg text-center bg-green-100 text-green-800"
              animate={{ 
                scale: [1, 1.02, 1],
                backgroundColor: [
                  'rgba(198, 246, 213, 1)',
                  'rgba(154, 230, 180, 1)',
                  'rgba(198, 246, 213, 1)'
                ]
              }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              <div className="text-xl font-bold mb-1">
                {selectedSoil === 'clay' ? 'Clay Volcanic Soil' : 'Loam Volcanic Soil'}
              </div>
              <div className="text-sm">
                {selectedSoil === 'clay' ? 
                  'Excellent for tea cultivation' : 
                  'Good for diversified crops'}
              </div>
            </motion.div>
            
            <div className="mt-3 text-sm text-gray-700">
              <h4 className="font-medium mb-1">Management Tips:</h4>
              <ul className="list-disc pl-5 space-y-1">
                <li>Add lime to balance pH (current: {soilData.properties.PHIHOX.toFixed(1)})</li>
                <li>Maintain high organic matter levels</li>
                <li>Practice contour farming on slopes</li>
                <li>Rotate with nitrogen-fixing crops</li>
              </ul>
            </div>
          </motion.div>
        </div>
        
        {/* Recommended Crops */}
        <div className="mt-6">
          <h3 className="font-medium text-gray-800 mb-3 flex items-center">
            <Leaf size={16} className="mr-2 text-green-600" />
            Recommended Crops for Volcanic Soil:
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <AnimatePresence>
              {getCropRecommendations().map((crop, index) => (
                <motion.div 
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-gradient-to-br from-green-50 to-blue-50 p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow border border-green-100"
                  whileHover={{ y: -3 }}
                >
                  <div className="flex items-start">
                    <motion.span 
                      className="text-3xl mr-3"
                      animate={{ 
                        scale: [1, 1.2, 1],
                        rotate: [0, 5, -5, 0]
                      }}
                      transition={{ duration: 4, repeat: Infinity }}
                    >
                      {crop.icon}
                    </motion.span>
                    <div>
                      <div className="font-bold text-gray-800">{crop.name}</div>
                      <p className="text-sm text-gray-600 mt-1">{crop.description}</p>
                      <motion.div
                        className="mt-3 h-2 bg-gray-200 rounded-full overflow-hidden"
                        initial={{ width: 0 }}
                        animate={{ width: '100%' }}
                        transition={{ delay: 0.5 + index * 0.1 }}
                      >
                        <div 
                          className={`h-full rounded-full ${
                            crop.confidence > 90 ? 'bg-green-500' :
                            crop.confidence > 80 ? 'bg-blue-500' :
                            'bg-yellow-500'
                          }`}
                          style={{ width: `${crop.confidence}%` }}
                        ></div>
                      </motion.div>
                      <div className="text-xs text-right mt-1 text-gray-500">
                        Suitability: {crop.confidence}%
                      </div>
                      <div className="mt-2">
                        <h5 className="text-xs font-medium text-gray-700">Benefits:</h5>
                        <ul className="text-xs text-gray-600">
                          {crop.benefits.map((benefit, i) => (
                            <li key={i} className="flex items-start mt-1">
                              <span className="text-green-500 mr-1">✓</span>
                              {benefit}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
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
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ delay: index * 0.1 }}
                className={`p-4 rounded-lg flex items-start transition-all duration-300 hover:shadow-md ${
                  activity.priority === 'High' 
                    ? 'bg-gradient-to-r from-red-50 to-red-100 border-l-4 border-red-400' 
                    : activity.priority === 'Medium'
                    ? 'bg-gradient-to-r from-yellow-50 to-amber-100 border-l-4 border-yellow-400'
                    : 'bg-gradient-to-r from-blue-50 to-blue-100 border-l-4 border-blue-400'
                }`}
                whileHover={{ 
                  y: -5,
                  boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)"
                }}
              >
                <div className="text-2xl mr-3">{activity.icon}</div>
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
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Footer */}
      <motion.footer 
        className="text-center text-sm text-gray-500 mt-8 pb-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
      >
        <p>Agricultural Advisory Dashboard for Kericho County</p>
        <p className="mt-1">Data updated: {lastUpdated}</p>
        <div className="flex justify-center space-x-4 mt-3 text-xs">
          <span>Weather: OpenWeatherMap</span>
          <span>•</span>
          <span>Soil: Kericho Volcanic Soil Profile</span>
        </div>
      </motion.footer>
    </div>
  );
};

export default Dashboard;