import { useState, useEffect, useCallback, useRef } from 'react';
import { Cloud, Droplets, Sun, Wind, Loader, X, Info, Thermometer, MapPin, Calendar, Moon, CloudRain, CloudSnow, CloudLightning, CloudDrizzle, Sunset, Sunrise } from 'lucide-react';

// Enhanced Weather Widget Component with improved animations and real API integration
interface WeatherData {
  temperature: number;
  feelsLike: number;
  description: string;
  icon: string;
  humidity: number;
  windSpeed: number;
  location: string;
  country: string;
  sunrise: number;
  sunset: number;
  visibility: number;
  pressure: number;
  forecast: { 
    date: string; 
    temp: number; 
    tempMin: number;
    tempMax: number;
    icon: string; 
    description: string;
    precipitation: number;
  }[];
  hourlyForecast: {
    time: string;
    temp: number;
    icon: string;
    description: string;
  }[];
  lastUpdated: Date;
}

const WeatherWidget = () => {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(true);
  const [activeTab, setActiveTab] = useState('current'); // 'current', 'daily', 'hourly'
  const [tempUnit, setTempUnit] = useState('C'); // 'C' or 'F'
  const [animationEnabled, setAnimationEnabled] = useState(true);
  
  // Animation references
  const rainRef = useRef<HTMLDivElement>(null);
  const cloudRef = useRef<HTMLDivElement>(null);
  
  // Kericho county coordinates (default)
  const LAT = -0.367;
  const LON = 35.283;
  const API_KEY = 'f0bb40f2b7926ef137fa37dd1170ea84'; // OpenWeatherMap API key
  
  // Format temperature based on selected unit
  const formatTemp = (temp: number) => {
    if (tempUnit === 'F') {
      return Math.round((temp * 9/5) + 32);
    }
    return Math.round(temp);
  };
  
  // Toggle temperature unit
  const toggleTempUnit = () => {
    setTempUnit(prevUnit => prevUnit === 'C' ? 'F' : 'C');
  };

  useEffect(() => {
    // Show popup after 1.5 seconds
    const timer = setTimeout(() => {
      setIsOpen(true);
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  const fetchWeatherData = useCallback(async () => {
    setLoading(true);
    try {
      // In a production environment, these would be real API calls
      
      // Fetch current weather
      const currentWeatherResponse = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${LAT}&lon=${LON}&appid=${API_KEY}&units=metric`
      );
      
      if (!currentWeatherResponse.ok) {
        throw new Error(`Weather API error: ${currentWeatherResponse.statusText}`);
      }
      
      const currentData = await currentWeatherResponse.json();
      
      // Fetch 5-day forecast
      const forecastResponse = await fetch(
        `https://api.openweathermap.org/data/2.5/forecast?lat=${LAT}&lon=${LON}&appid=${API_KEY}&units=metric`
      );
      
      if (!forecastResponse.ok) {
        throw new Error(`Forecast API error: ${forecastResponse.statusText}`);
      }
      
      const forecastData = await forecastResponse.json();
      
      // Process forecast data to get daily forecasts
      const dailyForecasts = [];
      const hourlyForecasts = [];
      const processedDates = new Set();
      
      // Process first 24 hours for hourly forecast
      for (let i = 0; i < 8; i++) {
        const item = forecastData.list[i];
        const date = new Date(item.dt * 1000);
        
        hourlyForecasts.push({
          time: date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
          temp: item.main.temp,
          icon: item.weather[0].icon,
          description: item.weather[0].description
        });
      }
      
      // Process 5-day forecast
      for (const item of forecastData.list) {
        const date = new Date(item.dt * 1000);
        const dateStr = date.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit' });
        
        // Only take one reading per day (noon)
        if (!processedDates.has(dateStr) && date.getHours() >= 12 && date.getHours() <= 15) {
          processedDates.add(dateStr);
          dailyForecasts.push({
            date: dateStr,
            temp: item.main.temp,
            tempMin: item.main.temp_min,
            tempMax: item.main.temp_max,
            icon: item.weather[0].icon,
            description: item.weather[0].description,
            precipitation: item.rain ? item.rain['3h'] : 0 // 3h rainfall if available
          });
          
          // Limit to 5 days
          if (dailyForecasts.length >= 5) break;
        }
      }

      // Set the combined weather data
      setWeather({
        temperature: currentData.main.temp,
        feelsLike: currentData.main.feels_like,
        description: currentData.weather[0].description,
        icon: currentData.weather[0].icon,
        humidity: currentData.main.humidity,
        windSpeed: currentData.wind.speed,
        location: currentData.name,
        country: currentData.sys.country,
        sunrise: currentData.sys.sunrise,
        sunset: currentData.sys.sunset,
        visibility: currentData.visibility / 1000, // convert to km
        pressure: currentData.main.pressure,
        forecast: dailyForecasts,
        hourlyForecast: hourlyForecasts,
        lastUpdated: new Date()
      });
      
      setLoading(false);
    } catch (err) {
      console.error("Error fetching weather data:", err);
      // Fallback to simulated data for demo purposes
      provideFallbackData();
      setError('API connection failed. Using demo data.');
      setTimeout(() => setError(null), 5000);
    }
  }, [API_KEY]);
  
  // Fallback data provider in case API fails
  const provideFallbackData = () => {
    const currentDate = new Date();
    
    // Generate hourly forecast
    const hourlyForecast = [];
    for (let i = 0; i < 8; i++) {
      const forecastTime = new Date(currentDate.getTime() + i * 3600000);
      hourlyForecast.push({
        time: forecastTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        temp: 19 + Math.sin(i/2) * 3,
        icon: i < 3 ? '10d' : (i < 6 ? '04d' : '01d'),
        description: i < 3 ? 'light rain' : (i < 6 ? 'scattered clouds' : 'clear sky')
      });
    }
    
    // Generate daily forecast
    const dailyForecast = [];
    for (let i = 0; i < 5; i++) {
      const forecastDate = new Date(currentDate);
      forecastDate.setDate(forecastDate.getDate() + i);
      
      dailyForecast.push({
        date: forecastDate.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit' }),
        temp: 20 + Math.sin(i) * 3,
        tempMin: 18 + Math.sin(i) * 2,
        tempMax: 22 + Math.sin(i) * 3,
        icon: ['10d', '01d', '04d', '10d', '04d'][i],
        description: ['light rain', 'clear sky', 'scattered clouds', 'moderate rain', 'broken clouds'][i],
        precipitation: [2.5, 0, 0, 4.3, 0][i]
      });
    }
    
    setWeather({
      temperature: 19.8,
      feelsLike: 19.2,
      description: "light rain",
      icon: "10d",
      humidity: 78,
      windSpeed: 3.6,
      location: "Kericho",
      country: "KE",
      sunrise: Math.floor(currentDate.setHours(6, 30) / 1000),
      sunset: Math.floor(currentDate.setHours(18, 45) / 1000),
      visibility: 10,
      pressure: 1015,
      forecast: dailyForecast,
      hourlyForecast: hourlyForecast,
      lastUpdated: new Date()
    });
    
    setLoading(false);
  };

  useEffect(() => {
    fetchWeatherData();
    
    // Refresh weather data every 15 minutes
    const refreshInterval = setInterval(fetchWeatherData, 15 * 60 * 1000);
    
    return () => clearInterval(refreshInterval);
  }, [fetchWeatherData]);
  
  // Animation effects for weather conditions
  useEffect(() => {
    if (!weather || !animationEnabled) return;
    
    // Handle rain animation
    if (weather.description.includes('rain') && rainRef.current) {
      const raindrops = rainRef.current.children;
      for (let i = 0; i < raindrops.length; i++) {
        const drop = raindrops[i] as HTMLElement;
        drop.style.left = `${5 + (i * 7)}%`;
        drop.style.animationDuration = `${0.5 + Math.random() * 1}s`;
        drop.style.animationDelay = `${Math.random() * 1}s`;
      }
    }
    
    // Handle cloud animation
    if (cloudRef.current) {
      const clouds = cloudRef.current.children;
      for (let i = 0; i < clouds.length; i++) {
        const cloud = clouds[i] as HTMLElement;
        cloud.style.left = `${Math.random() * 85}%`;
        cloud.style.top = `${Math.random() * 40}%`;
        cloud.style.animationDuration = `${20 + Math.random() * 10}s`;
        cloud.style.animationDelay = `${Math.random() * 5}s`;
        cloud.style.opacity = `${0.7 + Math.random() * 0.3}`;
        cloud.style.transform = `scale(${0.8 + Math.random() * 0.4})`;
      }
    }
  }, [weather, animationEnabled]);

  const toggleMinimize = () => {
    setIsMinimized(!isMinimized);
    // Reset to current tab when maximizing
    if (isMinimized) {
      setActiveTab('current');
    }
  };

  const closeWidget = () => {
    setIsOpen(false);
  };

  // Get time string from Unix timestamp
  const getTimeFromTimestamp = (timestamp: number) => {
    const date = new Date(timestamp * 1000);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };
  
  // Check if it's daytime based on sunrise/sunset
  const isDaytime = () => {
    if (!weather) return true;
    const now = Math.floor(Date.now() / 1000);
    return now > weather.sunrise && now < weather.sunset;
  };

  // Helper function to get weather icon component based on condition
  const getWeatherIcon = (iconCode: string, size = 28) => {
    // Determine if it's day or night for dynamic icon display
    const isDay = iconCode.includes('d');
    
    if (iconCode.includes('01')) 
      return isDay ? <Sun size={size} className="text-yellow-400" /> : <Moon size={size} className="text-blue-200" />;
    
    if (iconCode.includes('02')) 
      return isDay ? 
        <div className="relative"><Sun size={size} className="text-yellow-400" /><Cloud size={size*0.8} className="text-gray-300 absolute -bottom-1 -right-1" /></div> : 
        <div className="relative"><Moon size={size} className="text-blue-200" /><Cloud size={size*0.8} className="text-gray-400 absolute -bottom-1 -right-1" /></div>;
    
    if (iconCode.includes('03')) 
      return <Cloud size={size} className="text-gray-300" />;
    
    if (iconCode.includes('04')) 
      return (
        <div className="relative">
          <Cloud size={size} className="text-gray-400" />
          <Cloud size={size*0.7} className="text-gray-300 absolute -bottom-1 -right-1" />
        </div>
      );
    
    if (iconCode.includes('09')) 
      return <CloudDrizzle size={size} className="text-blue-400" />;
    
    if (iconCode.includes('10')) 
      return <CloudRain size={size} className="text-blue-400" />;
    
    if (iconCode.includes('11')) 
      return <CloudLightning size={size} className="text-yellow-500" />;
    
    if (iconCode.includes('13')) 
      return <CloudSnow size={size} className="text-blue-100" />;
    
    if (iconCode.includes('50')) 
      return <Wind size={size} className="text-gray-400" />;
    
    return <Cloud size={size} className="text-gray-400" />;
  };
  
  // Format date for display
  const formatDate = (dateStr: string) => {
    const [day, month] = dateStr.split('/');
    return `${day}/${month}`;
  };
  
  // Get background gradient based on weather and time
  const getBackgroundGradient = () => {
    if (!weather) return 'from-blue-600 to-blue-800';
    
    const isDay = isDaytime();
    
    if (weather.description.includes('rain') || weather.description.includes('drizzle'))
      return isDay ? 'from-gray-500 to-blue-700' : 'from-gray-800 to-blue-900';
      
    if (weather.description.includes('cloud'))
      return isDay ? 'from-blue-400 to-gray-500' : 'from-gray-800 to-blue-900';
      
    if (weather.description.includes('clear'))
      return isDay ? 'from-blue-400 to-cyan-600' : 'from-indigo-900 to-blue-900';
      
    if (weather.description.includes('snow'))
      return isDay ? 'from-blue-200 to-gray-400' : 'from-blue-900 to-gray-800';
      
    if (weather.description.includes('thunder'))
      return isDay ? 'from-gray-700 to-blue-900' : 'from-gray-900 to-purple-900';
      
    // Default gradient
    return isDay ? 'from-blue-500 to-cyan-600' : 'from-blue-900 to-purple-900';
  };

  if (!isOpen) return null;

  return (
    <div 
      className={`fixed top-4 right-4 z-50 transition-all duration-500 ease-in-out ${
        isMinimized 
          ? 'w-16 h-16 rounded-full cursor-pointer bg-gradient-to-br from-emerald-500 to-blue-500 shadow-lg hover:shadow-xl hover:scale-105' 
          : 'bg-white/95 backdrop-blur-lg shadow-2xl border border-emerald-500/30 rounded-2xl p-4 w-96'
      } ${isOpen ? 'scale-100 opacity-100' : 'scale-90 opacity-0'}`}
      onClick={isMinimized ? toggleMinimize : undefined}
    >
      {isMinimized ? (
        <div className="w-full h-full flex items-center justify-center relative overflow-hidden">
          <div className={`absolute inset-0 bg-gradient-to-br ${getBackgroundGradient()} opacity-90`}></div>
          <div className="absolute w-24 h-24 bg-white/20 rounded-full -bottom-12 -right-12"></div>
          <div className="absolute w-16 h-16 bg-white/10 rounded-full -top-8 -left-8"></div>
          {weather ? getWeatherIcon(weather.icon, 32) : <Cloud size={32} className="text-white relative z-10" />}
        </div>
      ) : (
        <div className="relative">
          <div className="absolute top-0 right-0 flex space-x-1">
            <button 
              onClick={() => setAnimationEnabled(!animationEnabled)}
              className="text-gray-500 hover:text-emerald-600 transition-colors p-1"
              title={animationEnabled ? "Disable animations" : "Enable animations"}
            >
              {animationEnabled ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 18l6-6-6-6" />
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                </svg>
              )}
            </button>
            <button 
              onClick={toggleMinimize}
              className="text-gray-500 hover:text-gray-700 transition-colors p-1"
              title="Minimize"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            <button 
              onClick={closeWidget}
              className="text-gray-500 hover:text-red-500 transition-colors p-1"
              title="Close"
            >
              <X size={16} />
            </button>
          </div>
          
          <div className="flex items-center mb-3">
            <div className={`w-6 h-6 rounded-full bg-gradient-to-br ${getBackgroundGradient()} flex items-center justify-center mr-2`}>
              {weather && getWeatherIcon(weather.icon, 14)}
            </div>
            <h3 className="text-lg font-semibold text-emerald-700">Weather Forecast</h3>
            {!loading && !error && (
              <button 
                onClick={fetchWeatherData} 
                className="ml-auto text-xs bg-emerald-100 hover:bg-emerald-200 text-emerald-700 px-2 py-1 rounded transition-colors mr-1"
                title="Refresh weather data"
              >
                Refresh
              </button>
            )}
            <button
              onClick={toggleTempUnit}
              className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-2 py-1 rounded transition-colors"
              title="Change temperature unit"
            >
              °{tempUnit}
            </button>
          </div>
          
          {loading ? (
            <div className="flex flex-col items-center justify-center p-6">
              <Loader className="animate-spin text-emerald-600 mb-2" />
              <p className="text-sm text-gray-600">Fetching latest weather data...</p>
            </div>
          ) : error ? (
            <div className="text-amber-600 text-sm p-3 bg-amber-50 rounded flex items-center">
              <Info size={16} className="mr-2 flex-shrink-0" />
              <span>{error}</span>
            </div>
          ) : (
            <>
              {/* Tabs for different views */}
              <div className="flex border-b border-gray-200 mb-3">
                <button
                  className={`px-3 py-2 text-sm font-medium transition-colors relative ${
                    activeTab === 'current' 
                      ? 'text-emerald-600' 
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                  onClick={() => setActiveTab('current')}
                >
                  Current
                  {activeTab === 'current' && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500"></span>
                  )}
                </button>
                <button
                  className={`px-3 py-2 text-sm font-medium transition-colors relative ${
                    activeTab === 'daily' 
                      ? 'text-emerald-600' 
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                  onClick={() => setActiveTab('daily')}
                >
                  5-Day
                  {activeTab === 'daily' && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500"></span>
                  )}
                </button>
                <button
                  className={`px-3 py-2 text-sm font-medium transition-colors relative ${
                    activeTab === 'hourly' 
                      ? 'text-emerald-600' 
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                  onClick={() => setActiveTab('hourly')}
                >
                  Hourly
                  {activeTab === 'hourly' && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500"></span>
                  )}
                </button>
              </div>
              
              {activeTab === 'current' && (
                <>
                  {/* Current weather panel */}
                  <div className={`bg-gradient-to-br ${getBackgroundGradient()} p-4 rounded-xl mb-3 shadow-sm relative overflow-hidden`}>
                    {/* Weather animation elements */}
                    {animationEnabled && (
                      <>
                        {weather.description.includes('rain') && (
                          <div ref={rainRef} className="absolute inset-0 overflow-hidden pointer-events-none">
                            {[...Array(16)].map((_, i) => (
                              <div 
                                key={i}
                                className="absolute animate-fall opacity-80"
                              >
                                <div className="w-0.5 h-2 bg-blue-200/70 rounded-full"></div>
                              </div>
                            ))}
                          </div>
                        )}
                        
                        {weather.description.includes('cloud') && !weather.description.includes('rain') && (
                          <div ref={cloudRef} className="absolute inset-0 overflow-hidden pointer-events-none">
                            {[...Array(3)].map((_, i) => (
                              <div 
                                key={i}
                                className="absolute animate-float opacity-30"
                              >
                                <Cloud size={60} className="text-white" />
                              </div>
                            ))}
                          </div>
                        )}
                      </>
                    )}
                    
                    <div className="relative z-10">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center text-white/90">
                          <MapPin size={14} className="mr-1" />
                          <span className="font-medium">{weather.location}, {weather.country}</span>
                        </div>
                        <div className="text-xs text-white/80">
                          Last updated: {weather.lastUpdated.toLocaleTimeString()}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <div className="relative w-16 h-16 flex items-center justify-center bg-white/20 rounded-full backdrop-blur-sm">
                          {getWeatherIcon(weather.icon, 42)}
                        </div>
                        
                        <div className="flex-1">
                          <div className="capitalize text-white font-medium mb-0.5">{weather.description}</div>
                          <div className="flex items-end gap-2">
                            <div className="text-3xl font-bold text-white">{formatTemp(weather.temperature)}°<span className="text-lg">{tempUnit}</span></div>
                            <div className="text-white/80 text-sm mb-1">Feels like {formatTemp(weather.feelsLike)}°</div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                        <div className="flex items-center bg-white/20 backdrop-blur-sm p-2 rounded text-white">
                          <Droplets size={14} className="mr-1.5" />
                          <span>Humidity: {weather.humidity}%</span>
                        </div>
                        <div className="flex items-center bg-white/20 backdrop-blur-sm p-2 rounded text-white">
                          <Wind size={14} className="mr-1.5" />
                          <span>Wind: {weather.windSpeed} m/s</span>
                        </div>
                        <div className="flex items-center bg-white/20 backdrop-blur-sm p-2 rounded text-white">
                          <Sunrise size={14} className="mr-1.5" />
                          <span>Sunrise: {getTimeFromTimestamp(weather.sunrise)}</span>
                        </div>
                        <div className="flex items-center bg-white/20 backdrop-blur-sm p-2 rounded text-white">
                          <Sunset size={14} className="mr-1.5" />
                          <span>Sunset: {getTimeFromTimestamp(weather.sunset)}</span>
                        </div>
                        <div className="flex items-center bg-white/20 backdrop-blur-sm p-2 rounded text-white">
                          <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" fill="none" className="mr-1.5">
                            <circle cx="12" cy="12" r="10" />
                            <path d="M8 12h8" />
                          </svg>
                          <span>Pressure: {weather.pressure} hPa</span>
                        </div>
                        <div className="flex items-center bg-white/20 backdrop-blur-sm p-2 rounded text-white">
                          <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" fill="none" className="mr-1.5">
                            <path d="M12 2v8m0 4v8" />
                            <circle cx="12" cy="12" r="2" />
                          </svg>
                          <span>Visibility: {weather.visibility} km</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
              
              {activeTab === 'daily' && (
                <div className="bg-white p-3 rounded-xl shadow-sm border border-gray-100">
                  <div className="flex items-center mb-3 px-1">
                    <Calendar size={14} className="mr-1.5 text-gray-500" />
                    <h4 className="text-sm font-semibold text-gray-700">5-Day Forecast</h4>
                  </div>
                  
                  {weather.forecast.map((day, index) => (
                    <div 
                      key={index} 
                      className={`flex items-center justify-between p-2 ${
                        index < weather.forecast.length - 1 ? 'border-b border-gray-100' : ''
                      } hover:bg-gray-50 rounded transition-colors`}
                    >
                      <div className="flex items-center">
                        <div className="w-9 text-center">
                          <div className="text-xs font-medium text-gray-500">{
                            index === 0 ? 'Today' : formatDate(day.date)
                          }</div>
                        </div>
                        <div className="w-10 flex justify-center">
                          {getWeatherIcon(day.icon, 24)}
                        </div>
                        <div className="ml-2">
                          <div className="text-xs capitalize text-gray-600">{day.description}</div>
                          {day.precipitation > 0 && (
                            <div className="text-xs text-blue-500 flex items-center">
                              <Droplets size={10} className="mr-0.5" />
                              {day.precipitation.toFixed(1)} mm
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-gray-400">{formatTemp(day.tempMin)}°</span>
                        <div className="w-16 h-1 bg-gray-200 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-blue-400 to-red-400 rounded-full" 
                            style={{ 
                              width: `${((day.temp - day.tempMin) / (day.tempMax - day.tempMin)) * 100}%` 
                            }}
                          ></div>
                        </div>
                        <span className="text-xs font-medium">{formatTemp(day.tempMax)}°</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {activeTab === 'hourly' && (
                <div className="bg-white p-3 rounded-xl shadow-sm border border-gray-100">
                  <div className="flex items-center mb-3 px-1">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mr-1.5 text-gray-500">
                      <circle cx="12" cy="12" r="10" />
                      <polyline points="12 6 12 12 16 14" />
                    </svg>
                    <h4 className="text-sm font-semibold text-gray-700">Hourly Forecast</h4>
                  </div>
                  
                  <div className="flex overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                    <div className="flex space-x-3">
                      {weather.hourlyForecast.map((hour, index) => (
                        <div 
                          key={index} 
                          className="flex flex-col items-center min-w-16 p-2 rounded-lg transition-transform hover:bg-blue-50 hover:scale-105"
                        >
                          <span className="text-xs font-medium text-gray-600">{hour.time}</span>
                          <div className="my-1">
                            {getWeatherIcon(hour.icon, 22)}
                          </div>
                          <span className="text-sm font-semibold text-gray-700">{formatTemp(hour.temp)}°</span>
                          {hour.description.includes('rain') && (
                            <div className="mt-1 flex items-center text-xs text-blue-500">
                              <Droplets size={10} className="mr-0.5" />
                              <span>Rain</span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
              
              <div className="flex items-center justify-between text-xs text-gray-500 mt-3">
                <div className="flex items-center">
                  <span className="text-xs text-emerald-600 mr-1">●</span>
                  <span>OpenWeatherMap API</span>
                </div>
                
                <button 
                  onClick={() => window.open('https://openweathermap.org/', '_blank')}
                  className="text-xs hover:text-blue-500 transition-colors"
                >
                  Learn more
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

// Enhanced Signup Page Component with improved weather integration
export default function SignupPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    farmLocation: '',
    farmSize: '',
    soilType: 'clay',
    primaryCrops: '',
    irrigationSystem: 'none',
  });
  
  const [weatherStats, setWeatherStats] = useState({
    condition: 'rainy', // Default to rainy for Kericho county
    temperature: 18,
    humidity: 75,
    rainfall: 85, // mm/month
    soilMoisture: 'good',
    windSpeed: 5
  });
  
  const [isLoading, setIsLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showTips, setShowTips] = useState(false);
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [cropRecommendations, setCropRecommendations] = useState([]);
  const [darkMode, setDarkMode] = useState(false);
  
  // Animation references for background elements
  const particlesRef = useRef(null);
  
  // Check time of day automatically
  useEffect(() => {
    const hour = new Date().getHours();
    setDarkMode(hour < 6 || hour > 18);
    
    // Simulate weather data loading
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1500);
    
    return () => clearTimeout(timer);
  }, []);
  
  // Generate crop recommendations based on weather and soil
  useEffect(() => {
    if (!isLoading) {
      // In a real app, we'd fetch this from an agricultural API
      // For demo, we'll generate recommendations based on weather stats
      const recommendations = [];
      
      if (weatherStats.rainfall > 80) {
        recommendations.push({
          crop: 'Tea',
          confidence: 95,
          growthPeriod: '3-5 years',
          waterRequirements: 'High',
          soilPreference: 'Acidic, well-drained'
        });
        recommendations.push({
          crop: 'Rice',
          confidence: 85,
          growthPeriod: '3-6 months',
          waterRequirements: 'Very high',
          soilPreference: 'Clay, wet'
        });
      }
      
      if (weatherStats.temperature > 15 && weatherStats.temperature < 25) {
        recommendations.push({
          crop: 'Maize',
          confidence: 90,
          growthPeriod: '3-5 months',
          waterRequirements: 'Moderate',
          soilPreference: 'Loamy, well-drained'
        });
        recommendations.push({
          crop: 'Beans',
          confidence: 88,
          growthPeriod: '2-3 months',
          waterRequirements: 'Low to moderate',
          soilPreference: 'Well-drained, fertile'
        });
      }
      
      if (weatherStats.soilMoisture === 'good') {
        recommendations.push({
          crop: 'Potatoes',
          confidence: 87,
          growthPeriod: '3-4 months',
          waterRequirements: 'Moderate',
          soilPreference: 'Loamy, slightly acidic'
        });
        recommendations.push({
          crop: 'Vegetables',
          confidence: 92,
          growthPeriod: '1-3 months',
          waterRequirements: 'Moderate to high',
          soilPreference: 'Rich, well-drained'
        });
      }
      
      setCropRecommendations(recommendations);
    }
  }, [isLoading, weatherStats]);
  
  // Update time
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    
    return () => clearInterval(timer);
  }, []);
  
  // Animation for background particles
  useEffect(() => {
    if (particlesRef.current) {
      const particles = particlesRef.current.children;
      for (let i = 0; i < particles.length; i++) {
        const particle = particles[i];
        particle.style.left = `${Math.random() * 100}%`;
        particle.style.top = `${Math.random() * 100}%`;
        particle.style.animationDuration = `${10 + Math.random() * 20}s`;
        particle.style.animationDelay = `${Math.random() * 5}s`;
        particle.style.opacity = `${0.1 + Math.random() * 0.3}`;
        particle.style.transform = `scale(${0.5 + Math.random()})`;
      }
    }
  }, [darkMode]);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submitted:', formData);
    setFormSubmitted(true);
    
    // Animate success message
    setTimeout(() => {
      setFormSubmitted(false);
    }, 3000);
  };
  
  // Calculate time of day for styling
  const hour = currentTime.getHours();
  const isDaytime = hour > 6 && hour < 18;
  
  // Get greeting based on time of day
  const getGreeting = () => {
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  };
  
  // Get season based on current month
  const getSeason = () => {
    const month = currentTime.getMonth();
    if (month >= 2 && month <= 4) return "Long Rainy Season";
    if (month >= 5 && month <= 8) return "Cool Dry season";
    if (month >= 9 && month <= 10) return "Short Rainy season";
    return "Hot Dry season";
  };
  
  return (
    <div className={`min-h-screen flex flex-col relative overflow-hidden transition-all duration-1000 ${
      darkMode 
        ? 'bg-gradient-to-br from-indigo-900 via-purple-800 to-blue-900' 
        : 'bg-gradient-to-br from-blue-400 via-cyan-400 to-green-400'
    }`}>
      {/* Weather widget popup */}
      <WeatherWidget />
      
      {/* Success message after form submission */}
      {formSubmitted && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-3 rounded-lg shadow-lg flex items-center animate-slideDown">
          <div className="mr-2 bg-white text-green-500 rounded-full p-1 flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          </div>
          <span className="font-medium">Registration successful! Welcome to Kericho Farm Planner.</span>
        </div>
      )}
      
      {/* Animated weather elements based on time of day and season */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Gradient overlay to add depth */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/20"></div>
        
        {weatherStats.condition === 'rainy' && (
          <div className="absolute inset-0">
            {[...Array(40)].map((_, i) => (
              <div 
                key={i}
                className="absolute animate-fall opacity-70"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `-20px`,
                  animationDuration: `${0.5 + Math.random() * 1.5}s`,
                  animationDelay: `${Math.random() * 2}s`,
                  animationIterationCount: 'infinite'
                }}
              >
                <div className="w-0.5 h-3 bg-blue-200/70 rounded-full"></div>
              </div>
            ))}
          </div>
        )}
        
        {weatherStats.condition === 'sunny' && !darkMode && (
          <div className="absolute top-10 right-10">
            <div className="relative animate-pulse">
              <div className="absolute inset-0 bg-yellow-500/30 blur-xl rounded-full"></div>
              <Sun size={120} className="text-yellow-300 relative z-10" />
            </div>
            <div className="absolute top-20 left-10 opacity-30 animate-slowPulse">
              <div className="bg-yellow-500/20 w-32 h-32 rounded-full blur-xl"></div>
            </div>
          </div>
        )}
        
        {darkMode && (
          <div className="absolute inset-0">
            {/* Stars */}
            {[...Array(50)].map((_, i) => (
              <div 
                key={i}
                className="absolute bg-white rounded-full animate-twinkle"
                style={{
                  width: `${1 + Math.random() * 2}px`,
                  height: `${1 + Math.random() * 2}px`,
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 60}%`,
                  animationDelay: `${Math.random() * 3}s`,
                  animationDuration: `${1 + Math.random() * 3}s`
                }}
              ></div>
            ))}
            
            {/* Moon */}
            <div className="absolute top-10 right-10">
              <div className="relative">
                <div className="absolute inset-0 bg-blue-100/20 blur-xl rounded-full"></div>
                <Moon size={80} className="text-blue-100 relative z-10" />
              </div>
            </div>
          </div>
        )}
        
        {weatherStats.condition === 'cloudy' && (
          <div className="absolute inset-0">
            {[...Array(8)].map((_, i) => (
              <div 
                key={i}
                className="absolute animate-float opacity-80"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 40}%`,
                  animationDuration: `${20 + Math.random() * 10}s`,
                  animationDelay: `${Math.random() * 5}s`,
                  animationIterationCount: 'infinite'
                }}
              >
                <Cloud size={60 + Math.random() * 40} className={darkMode ? "text-gray-700" : "text-gray-200"} />
              </div>
            ))}
          </div>
        )}
        
        {/* Floating particles for visual interest */}
        <div ref={particlesRef} className="absolute inset-0">
          {[...Array(20)].map((_, i) => (
            <div 
              key={`particle-${i}`}
              className="absolute w-2 h-2 rounded-full bg-white/20 animate-float"
            />
          ))}
        </div>
      </div>
      
      {/* Header with greeting and current season */}
      <header className="text-white text-center py-6 relative z-10">
        <div className="flex flex-col items-center">
          <h1 className="text-3xl md:text-4xl font-bold mb-1">{getGreeting()}, Farmer</h1>
          <div className="flex items-center bg-white/10 backdrop-blur-sm px-3 py-1 rounded-full text-sm">
            <span className="animate-pulse mr-2">●</span>
            <span>Current Season: {getSeason()}</span>
          </div>
        </div>
        <p className="text-white/80 mt-2 max-w-lg mx-auto">Plan your farming activities with real-time weather insights and AI-powered crop recommendations</p>
      </header>
      
      {/* Main content */}
      <div className="flex-1 flex flex-col md:flex-row items-center justify-center p-4 md:p-8 z-10 max-w-6xl mx-auto w-full gap-8">
        {/* Left side - Info panel */}
        <div className="w-full md:w-1/2 p-4 mb-8 md:mb-0">
          <div className="bg-white/20 backdrop-blur-md rounded-xl p-6 shadow-xl border border-white/30 transform transition-all hover:shadow-2xl duration-300">
            <h2 className="text-3xl md:text-4xl font-bold mb-6 text-white relative overflow-hidden">
              <span className="relative z-10">Kericho Farm Planner</span>
              <span className="absolute w-2/3 h-1 bg-emerald-400 bottom-1 left-0 transform -skew-x-12"></span>
            </h2>
            
            <div className="mb-6">
              <h3 className="text-xl font-semibold text-white mb-3 flex items-center">
                <Cloud className="mr-2" size={20} />
                Current Weather Stats
              </h3>
              {isLoading ? (
                <div className="flex justify-center py-4">
                  <Loader className="animate-spin text-white" />
                </div>
              ) : (
                <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm">
                  <div className="grid grid-cols-2 gap-3 text-white">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-500/30 rounded-full flex items-center justify-center">
                        <Thermometer size={18} className="text-blue-100" />
                      </div>
                      <div>
                        <div className="text-xs text-white/70">Temperature</div>
                        <div className="text-lg font-medium">{weatherStats.temperature}°C</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-500/30 rounded-full flex items-center justify-center">
                        <Droplets size={18} className="text-blue-100" />
                      </div>
                      <div>
                        <div className="text-xs text-white/70">Humidity</div>
                        <div className="text-lg font-medium">{weatherStats.humidity}%</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-500/30 rounded-full flex items-center justify-center">
                        <CloudRain size={18} className="text-blue-100" />
                      </div>
                      <div>
                        <div className="text-xs text-white/70">Monthly Rainfall</div>
                        <div className="text-lg font-medium">{weatherStats.rainfall} mm</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-500/30 rounded-full flex items-center justify-center">
                        <Wind size={18} className="text-blue-100" />
                      </div>
                      <div>
                        <div className="text-xs text-white/70">Wind Speed</div>
                        <div className="text-lg font-medium">{weatherStats.windSpeed} m/s</div>
                      </div>
                    </div>
                    
                    <div className="col-span-2 mt-1">
                      <div className="h-1 w-full bg-white/20 rounded-full">
                        <div 
                          className="h-full bg-gradient-to-r from-green-400 to-emerald-500 rounded-full"
                          style={{ width: `${weatherStats.soilMoisture === 'good' ? 90 : 60}%` }}
                        ></div>
                      </div>
                      <div className="flex justify-between text-xs mt-1">
                        <span>Soil Moisture Status: {weatherStats.soilMoisture === 'good' ? 'Optimal' : 'Moderate'}</span>
                        <span className="text-emerald-300">{weatherStats.soilMoisture === 'good' ? '90%' : '60%'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <div className="mb-6">
              <h3 className="text-xl font-semibold text-white mb-3 flex items-center">
                <div className="mr-2 w-5 h-5 bg-yellow-700 rounded-full flex items-center justify-center">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                </div>
                Soil Types in Kericho
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gradient-to-r from-yellow-800/50 to-yellow-700/40 p-3 rounded-lg text-white text-sm transition-all hover:-translate-y-1 cursor-pointer group">
                  <div className="font-medium mb-1 flex items-center">
                    <div className="w-3 h-3 rounded-full bg-yellow-800 mr-2"></div>
                    Clay Loam
                  </div>
                  <div className="text-xs text-white/80 group-hover:text-white">Great water retention, ideal for tea</div>
                </div>
                <div className="bg-gradient-to-r from-red-800/50 to-red-700/40 p-3 rounded-lg text-white text-sm transition-all hover:-translate-y-1 cursor-pointer group">
                  <div className="font-medium mb-1 flex items-center">
                    <div className="w-3 h-3 rounded-full bg-red-700 mr-2"></div>
                    Volcanic Soil
                  </div>
                  <div className="text-xs text-white/80 group-hover:text-white">Rich in minerals, excellent fertility</div>
                </div>
                <div className="bg-gradient-to-r from-yellow-600/50 to-yellow-500/40 p-3 rounded-lg text-white text-sm transition-all hover:-translate-y-1 cursor-pointer group">
                  <div className="font-medium mb-1 flex items-center">
                    <div className="w-3 h-3 rounded-full bg-yellow-500 mr-2"></div>
                    Sandy Loam
                  </div>
                  <div className="text-xs text-white/80 group-hover:text-white">Good drainage, warms quickly</div>
                </div>
                <div className="bg-gradient-to-r from-gray-700/50 to-gray-600/40 p-3 rounded-lg text-white text-sm transition-all hover:-translate-y-1 cursor-pointer group">
                  <div className="font-medium mb-1 flex items-center">
                    <div className="w-3 h-3 rounded-full bg-gray-800 mr-2"></div>
                    Black Cotton
                  </div>
                  <div className="text-xs text-white/80 group-hover:text-white">High clay content, shrinks when dry</div>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="text-xl font-semibold text-white mb-3 flex items-center">
                <div className="mr-2 w-5 h-5 bg-green-600 rounded-full flex items-center justify-center">
                  <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                </div>
                AI Crop Recommendations
              </h3>
              <div className="bg-white/10 backdrop-blur-sm p-4 rounded-lg text-white hover:bg-white/15 transition-all">
                <p className="mb-3">Based on real-time climate data and soil analysis for Kericho County:</p>
                
                {isLoading ? (
                  <div className="flex justify-center py-4">
                    <Loader className="animate-spin text-white/70" size={20} />
                  </div>
                ) : (
                  <div className="space-y-3">
                    {cropRecommendations.slice(0, 3).map((crop, index) => (
                      <div 
                        key={index} 
                        className="bg-white/10 rounded-lg p-3 hover:bg-white/20 transition-colors cursor-pointer group"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="font-medium">{crop.crop}</div>
                          <div className="text-xs px-2 py-0.5 bg-emerald-500/30 rounded-full">
                            {crop.confidence}% match
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-2 text-xs text-white/80">
                          <div className="flex items-center">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mr-1">
                              <circle cx="12" cy="12" r="10" />
                              <polyline points="12 6 12 12 16 14" />
                            </svg>
                            Growth: {crop.growthPeriod}
                          </div>
                          <div className="flex items-center">
                            <Droplets size={12} className="mr-1" />
                            Water: {crop.waterRequirements}
                          </div>
                          <div className="col-span-2 flex items-center">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mr-1">
                              <path d="M2 12h20M12 2v20" />
                            </svg>
                            Soil: {crop.soilPreference}
                          </div>
                        </div>
                        
                        <div className="w-full h-0.5 bg-white/10 mt-2 mb-1 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-emerald-400 to-green-500"
                            style={{ width: `${crop.confidence}%` }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            
            <button 
              className="mt-4 w-full flex items-center justify-center py-2 bg-white/20 text-white rounded-lg hover:bg-white/30 transition-colors text-sm backdrop-blur-sm"
              onClick={() => setShowTips(!showTips)}
            >
              {showTips ? "Hide Expert Farming Tips" : "Show Expert Farming Tips"}
              <svg 
                width="16" 
                height="16" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                className={`ml-1 transition-transform duration-300 ${showTips ? 'rotate-180' : ''}`}
              >
                <path d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            
            {showTips && (
              <div className="mt-4 bg-white/10 backdrop-blur-sm p-4 rounded-lg text-white animate-fadeIn">
                <h3 className="font-semibold mb-3 flex items-center">
                  <Calendar size={16} className="mr-2" />
                  Seasonal Planting & Cultivation Tips
                </h3>
                <ul className="space-y-3 text-sm">
                  <li className="flex items-start bg-white/5 p-2 rounded-lg hover:bg-white/10 transition-colors">
                    <div className="bg-green-600/30 p-1 rounded mr-2 mt-0.5">
                      <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                    </div>
                    <div>
                      <span className="font-medium">Optimal Planting Windows</span>
                      <p className="text-white/80 text-xs mt-0.5">Plant maize during long rains (March-April) for highest yields. Consider early-maturing varieties for short rain seasons.</p>
                    </div>
                  </li>
                  <li className="flex items-start bg-white/5 p-2 rounded-lg hover:bg-white/10 transition-colors">
                    <div className="bg-green-600/30 p-1 rounded mr-2 mt-0.5">
                      <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                    </div>
                    <div>
                      <span className="font-medium">Soil Management</span>
                      <p className="text-white/80 text-xs mt-0.5">Use crop rotation with legumes to improve soil nitrogen. Apply mulching during dry periods to conserve soil moisture.</p>
                    </div>
                  </li>
                  <li className="flex items-start bg-white/5 p-2 rounded-lg hover:bg-white/10 transition-colors">
                    <div className="bg-green-600/30 p-1 rounded mr-2 mt-0.5">
                      <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                    </div>
                    <div>
                      <span className="font-medium">Tea Cultivation</span>
                      <p className="text-white/80 text-xs mt-0.5">Maintain proper drainage in tea fields during heavy rainfall. Prune after heavy rains for better branching and leaf formation.</p>
                    </div>
                  </li>
                  <li className="flex items-start bg-white/5 p-2 rounded-lg hover:bg-white/10 transition-colors">
                    <div className="bg-green-600/30 p-1 rounded mr-2 mt-0.5">
                      <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                    </div>
                    <div>
                      <span className="font-medium">Water Management</span>
                      <p className="text-white/80 text-xs mt-0.5">Implement water harvesting during rainy seasons. Consider drip irrigation for vegetable gardens during drier periods.</p>
                    </div>
                  </li>
                </ul>
                
                <div className="mt-3 bg-blue-500/20 p-3 rounded-lg flex items-start">
                  <Info size={16} className="text-blue-200 mr-2 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-white/90">
                    Register with our system to receive custom agricultural advisories based on real-time weather forecasts, tailored specifically for your farm's location and soil type.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Right side - Signup form with enhanced design */}
        <div className="w-full md:w-1/2 md:pl-4">
          <form 
            onSubmit={handleSubmit}
            className="bg-white/10 backdrop-blur-md rounded-xl p-6 shadow-xl border border-white/30 transform transition-all hover:shadow-2xl duration-300"
          >
            <h2 className="text-2xl font-bold text-white mb-6 relative">
              <span className="relative z-10">Farm Registration</span>
              <span className="absolute w-1/3 h-1 bg-emerald-400 bottom-1 left-0 transform -skew-x-12"></span>
            </h2>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-white/90 mb-1">Full Name</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="w-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg px-4 py-2 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition-all"
                    placeholder="John Doe"
                  />
                </div>
                
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-white/90 mb-1">Email</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="w-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg px-4 py-2 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition-all"
                    placeholder="your@email.com"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-white/90 mb-1">Password</label>
                  <input
                    type="password"
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    minLength={8}
                    className="w-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg px-4 py-2 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition-all"
                    placeholder="••••••••"
                  />
                </div>
                
                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-white/90 mb-1">Confirm Password</label>
                  <input
                    type="password"
                    id="confirmPassword"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                    minLength={8}
                    className="w-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg px-4 py-2 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition-all"
                    placeholder="••••••••"
                  />
                </div>
              </div>
              
              <div>
                <label htmlFor="farmLocation" className="block text-sm font-medium text-white/90 mb-1">Farm Location</label>
                <input
                  type="text"
                  id="farmLocation"
                  name="farmLocation"
                  value={formData.farmLocation}
                  onChange={handleChange}
                  required
                  className="w-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg px-4 py-2 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition-all"
                  placeholder="Kericho County, Kenya"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="farmSize" className="block text-sm font-medium text-white/90 mb-1">Farm Size (acres)</label>
                  <input
                    type="number"
                    id="farmSize"
                    name="farmSize"
                    value={formData.farmSize}
                    onChange={handleChange}
                    required
                    min="0.1"
                    step="0.1"
                    className="w-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg px-4 py-2 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition-all"
                    placeholder="5.0"
                  />
                </div>
                
                <div>
                  <label htmlFor="soilType" className="block text-sm font-medium text-white/90 mb-1">Primary Soil Type</label>
                  <select
                    id="soilType"
                    name="soilType"
                    value={formData.soilType}
                    onChange={handleChange}
                    className="w-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition-all"
                  >
                    <option value="clay">Clay</option>
                    <option value="loam">Loam</option>
                    <option value="sandy">Sandy</option>
                    <option value="volcanic">Volcanic</option>
                    <option value="black-cotton">Black Cotton</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label htmlFor="primaryCrops" className="block text-sm font-medium text-white/90 mb-1">Primary Crops</label>
                <input
                  type="text"
                  id="primaryCrops"
                  name="primaryCrops"
                  value={formData.primaryCrops}
                  onChange={handleChange}
                  className="w-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg px-4 py-2 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition-all"
                  placeholder="Tea, Maize, Vegetables"
                />
              </div>
              
              <div>
                <label htmlFor="irrigationSystem" className="block text-sm font-medium text-white/90 mb-1">Irrigation System</label>
                <select
                  id="irrigationSystem"
                  name="irrigationSystem"
                  value={formData.irrigationSystem}
                  onChange={handleChange}
                  className="w-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition-all"
                >
                  <option value="none">None (Rain-fed)</option>
                  <option value="drip">Drip Irrigation</option>
                  <option value="sprinkler">Sprinkler System</option>
                  <option value="flood">Flood Irrigation</option>
                  <option value="other">Other</option>
                </select>
              </div>
              
            <div className="pt-2">
              <a href="/">
                <button
                  type="button"
                  className="w-full bg-gradient-to-r from-emerald-500 to-green-600 text-white font-medium py-3 px-4 rounded-lg hover:from-emerald-600 hover:to-green-700 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2 focus:ring-offset-white/10 transition-all shadow-lg hover:shadow-emerald-500/20"
                >
                  Register 
                </button>
              </a>
            </div>
              
              <p className="text-xs text-white/70 text-center">
                By registering, you agree to our <a href="#" className="text-emerald-300 hover:underline">Terms of Service</a> and <a href="#" className="text-emerald-300 hover:underline">Privacy Policy</a>.
              </p>
            </div>
          </form>
          
          <div className="mt-6 bg-white/10 backdrop-blur-sm p-4 rounded-xl border border-white/20">
            <h3 className="text-lg font-semibold text-white mb-3 flex items-center">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mr-2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
              Weather Protection Tips
            </h3>
            <ul className="space-y-2 text-sm text-white/90">
              <li className="flex items-start">
                <div className="bg-emerald-500/20 p-1 rounded-full mr-2 mt-0.5">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                  </svg>
                </div>
                <span>Protect young plants from heavy rainfall with temporary covers</span>
              </li>
              <li className="flex items-start">
                <div className="bg-emerald-500/20 p-1 rounded-full mr-2 mt-0.5">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                  </svg>
                </div>
                <span>Harvest rainwater during wet seasons for dry period irrigation</span>
              </li>
              <li className="flex items-start">
                <div className="bg-emerald-500/20 p-1 rounded-full mr-2 mt-0.5">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 2v4" />
                    <path d="m16.24 7.76 2.83 2.83" />
                    <path d="M18 12h4" />
                    <path d="m16.24 16.24 2.83-2.83" />
                    <path d="M12 18v4" />
                    <path d="m7.76 16.24-2.83-2.83" />
                    <path d="M6 12H2" />
                    <path d="m7.76 7.76-2.83 2.83" />
                  </svg>
                </div>
                <span>Monitor weather forecasts regularly for planting and harvesting windows</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
      
      {/* Footer */}
      <footer className="text-center py-6 text-white/70 text-sm relative z-10">
        <div className="container mx-auto px-4">
          <p>© {new Date().getFullYear()} Kericho Farm Planner. All rights reserved.</p>
          <p className="mt-1">Powered by OpenWeatherMap API and agricultural research data.</p>
        </div>
      </footer>
    </div>
  );
}