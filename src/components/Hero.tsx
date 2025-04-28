import React, { useState, useEffect, useRef } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Area, AreaChart } from 'recharts';
import { Cloud, CloudRain, Droplets, AlertTriangle, ArrowRight, Calendar, Clock, Wind, ThermometerSun, MapPin, RefreshCw, Umbrella, Sun, CloudLightning, ChevronRight, Loader } from 'lucide-react';

// Note: In a real application, you would need to provide your own OpenWeather API key
// This is a placeholder API key that should be replaced with your actual key
const API_KEY = "f0bb40f2b7926ef137fa37dd1170ea84";

// Set default coordinates for Kericho, Kenya
const KERICHO_COORDINATES = { lat: -0.3697, lon: 35.2838 };

export default function FarmFloodRiskDashboard() {
  const [location, setLocation] = useState("Kericho, Kenya");
  const [coordinates, setCoordinates] = useState(KERICHO_COORDINATES);
  interface WeatherData {
    temp: number;
    humidity: number;
    windSpeed: number;
    description: string;
    precipitation: number;
  }
  const [weather, setWeather] = useState<WeatherData | null>(null);
  interface ForecastDay {
    date: string;
    temp: number;
    precipChance: number;
    precip: number;
    icon: string;
  }
  
  const [forecast, setForecast] = useState<ForecastDay[]>([]);
  const [precipHistory, setPrecipHistory] = useState<{ date: string; amount: number; }[]>([]);
  const [soilMoisture, setSoilMoisture] = useState(78); // Mock data (percentage)
  const [floodRisk, setFloodRisk] = useState(65); // Mock data (percentage)
  const [loadingData, setLoadingData] = useState(true);
  const [selectedAction, setSelectedAction] = useState<(typeof recommendedActions)[0] | null>(null);
  const [showActionDetails, setShowActionDetails] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [locationStatus, setLocationStatus] = useState("idle"); // "idle", "loading", "success", "error"
  const [refreshAnimation, setRefreshAnimation] = useState(false);
  const [dataUpdatedTime, setDataUpdatedTime] = useState(new Date());
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipContent, setTooltipContent] = useState("");
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  
  // Refs for animations
  const precipChartRef = useRef<HTMLDivElement | null>(null);
  const riskIndicatorRef = useRef<HTMLDivElement | null>(null);

  // Farm locations around Kericho region
  const farmLocations = [
    { name: "Kericho, Kenya", lat: -0.3697, lon: 35.2838 },
    { name: "Tinderet Tea Farms", lat: -0.2233, lon: 35.2566 },
    { name: "Kipkelion Farms", lat: -0.3147, lon: 35.4629 },
    { name: "Londiani Valley", lat: -0.1683, lon: 35.5954 },
    { name: "Nandi Hills", lat: 0.1029, lon: 35.1841 },
  ];

  // Get user's current location on component mount
  useEffect(() => {
    const getUserLocation = () => {
      setLocationStatus("loading");
      
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const { latitude, longitude } = position.coords;
            setUserLocation({ lat: latitude, lon: longitude });
            
            // Find the closest farm location to the user
            const closestFarm = findClosestFarm({ lat: latitude, lon: longitude });
            setLocation(closestFarm.name);
            setCoordinates({ lat: closestFarm.lat, lon: closestFarm.lon });
            
            setLocationStatus("success");
            setTooltipContent("Location updated to nearest farm");
            setShowTooltip(true);
            setTimeout(() => setShowTooltip(false), 3000);
          },
          (error) => {
            console.error("Error getting location:", error);
            setLocationStatus("error");
            // Default to Kericho main town if location access fails
            setLocation("Kericho, Kenya");
            setCoordinates(KERICHO_COORDINATES);
          },
          { timeout: 10000, maximumAge: 60000 }
        );
      } else {
        setLocationStatus("error");
        // Default to Kericho main town if geolocation is not supported
        setLocation("Kericho, Kenya");
        setCoordinates(KERICHO_COORDINATES);
      }
    };
    
    getUserLocation();
  }, []);

  // Find the closest farm to the user's location
  const findClosestFarm = (userCoords: { lat: any; lon: any; }) => {
    let closestFarm = farmLocations[0];
    let minDistance = calculateDistance(
      userCoords.lat, 
      userCoords.lon, 
      farmLocations[0].lat, 
      farmLocations[0].lon
    );
    
    farmLocations.forEach(farm => {
      const distance = calculateDistance(
        userCoords.lat, 
        userCoords.lon, 
        farm.lat, 
        farm.lon
      );
      
      if (distance < minDistance) {
        minDistance = distance;
        closestFarm = farm;
      }
    });
    
    return closestFarm;
  };
  
  // Calculate distance between two coordinates using Haversine formula
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Radius of the earth in km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2); 
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
    const d = R * c; // Distance in km
    return d;
  };
  
  const deg2rad = (deg: number) => {
    return deg * (Math.PI/180);
  };

  // Animated fetch of weather data
  useEffect(() => {
    const fetchWeatherData = async () => {
      setLoadingData(true);
      setRefreshAnimation(true);
      
      try {
        // In a real application, this would call the OpenWeather API
        // For this demo, we'll use simulated data for Kericho, Kenya
        
        // Simulate API delay for animation purposes
        await new Promise(resolve => setTimeout(resolve, 1200));
        
        // Kericho, Kenya has a tropical climate with two rainy seasons
        // March-May (long rains) and October-November (short rains)
        const currentMonth = new Date().getMonth();
        const isRainySeason = (currentMonth >= 2 && currentMonth <= 4) || 
                             (currentMonth >= 9 && currentMonth <= 10);
        
        // Adjust weather patterns based on season
        const precipitationBase = isRainySeason ? 15 : 5;
        const humidityBase = isRainySeason ? 80 : 60;
        const tempBase = 22; // Kericho has relatively stable temperatures
        
        // Simulate current weather
        const mockCurrentWeather = {
          temp: Math.round(tempBase - 2 + Math.random() * 4), // Range: 20-24°C typical for Kericho
          humidity: Math.round(humidityBase - 5 + Math.random() * 15),
          windSpeed: Math.round(3 + Math.random() * 7), // Light winds typical
          description: isRainySeason ? 
            ["Scattered Showers", "Heavy Rain", "Thunderstorms", "Light Rain"][Math.floor(Math.random() * 4)] :
            ["Partly Cloudy", "Mostly Sunny", "Light Showers", "Clear"][Math.floor(Math.random() * 4)],
          precipitation: Math.round(precipitationBase * (0.5 + Math.random()))
        };
        
        // Simulate forecast - Kericho's weather patterns
        const mockForecast = [];
        const today = new Date();
        
        for (let i = 0; i < 7; i++) {
          const date = new Date(today);
          date.setDate(date.getDate() + i);
          
          // Higher chance of rain during rainy seasons
          const precipChance = isRainySeason ? 
            (40 + Math.random() * 50) : // 40-90% during rainy season
            (10 + Math.random() * 30);  // 10-40% during dry season
          
          // Temperature varies less in tropical highlands
          const dayTemp = tempBase - 1 + Math.random() * 4;
          
          mockForecast.push({
            date: date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
            temp: Math.round(dayTemp),
            precipChance: Math.round(precipChance),
            precip: Math.round((precipChance / 100) * precipitationBase),
            icon: precipChance > 60 ? 'heavy-rain' : 
                  precipChance > 40 ? 'light-rain' : 
                  precipChance > 20 ? 'cloudy' : 'sunny',
          });
        }
        
        // Simulate precipitation history - adjusted for Kericho's patterns
        const mockPrecipHistory = [];
        for (let i = 14; i >= 0; i--) {
          const date = new Date(today);
          date.setDate(date.getDate() - i);
          
          // Create more realistic rain patterns for Kericho
          let rainAmount;
          if (isRainySeason) {
            // Cluster rainy days together during rainy season
            const rainPattern = Math.sin((i + Math.random() * 5) * 0.7) + 1; // Create wave pattern
            rainAmount = Math.round(precipitationBase * rainPattern * (0.2 + Math.random()));
          } else {
            // Occasional rain during dry season
            rainAmount = Math.random() > 0.7 ? 
              Math.round(precipitationBase * 0.5 * Math.random()) : 0;
          }
          
          mockPrecipHistory.push({
            date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            amount: rainAmount,
          });
        }
        
        setWeather(mockCurrentWeather);
        setForecast(mockForecast);
        setPrecipHistory(mockPrecipHistory);
        
        // Calculate risk based on recent precipitation - adjusted for Kericho
        const recentRainfall = mockPrecipHistory.slice(-5).reduce((sum, day) => sum + day.amount, 0);
        const upcomingRainfall = mockForecast.slice(0, 3).reduce((sum, day) => sum + day.precip, 0);
        
        // Kericho's slopes can increase flooding risk with heavy rain
        const terrainFactor = 1.2; // Slopes increase risk
        setFloodRisk(Math.min(95, Math.round((recentRainfall + upcomingRainfall * terrainFactor) / 2)));
        setSoilMoisture(Math.min(98, Math.round(60 + recentRainfall / 4)));
        
        setDataUpdatedTime(new Date());
      } catch (error) {
        console.error("Error fetching weather data:", error);
      } finally {
        setLoadingData(false);
        // Keep refresh animation going slightly longer for visual effect
        setTimeout(() => setRefreshAnimation(false), 500);
      }
    };

    fetchWeatherData();
    
    // Refresh data every 15 minutes
    const refreshInterval = setInterval(fetchWeatherData, 15 * 60 * 1000);
    return () => clearInterval(refreshInterval);
  }, [coordinates]);

  // Trigger animation for precipitation chart on data change
  useEffect(() => {
    if (precipChartRef.current && !loadingData) {
      precipChartRef.current.classList.add('animate-fade-in');
      setTimeout(() => {
        if (precipChartRef.current) {
          precipChartRef.current.classList.remove('animate-fade-in');
        }
      }, 1000);
    }
  }, [precipHistory, loadingData]);

  // Trigger animation for risk indicator on risk change
  useEffect(() => {
    if (riskIndicatorRef.current && !loadingData) {
      riskIndicatorRef.current.classList.add('animate-pulse');
      setTimeout(() => {
        if (riskIndicatorRef.current) {
          riskIndicatorRef.current.classList.remove('animate-pulse');
        }
      }, 2000);
    }
  }, [floodRisk, loadingData]);

  // Actions recommended based on flood risk level - customized for Kericho tea farming
  const recommendedActions = [
    {
      id: 1,
      title: "Delay Planting",
      riskThreshold: 50,
      description: "Consider delaying tea planting operations by 10-14 days to allow hillside soils to stabilize and moisture levels to decrease.",
      benefits: [
        "Prevents seedling washout on Kericho's sloped terrain",
        "Ensures better root establishment in tea plants",
        "Reduces risk of soil erosion on hillside farms"
      ],
      urgency: "High",
      timeWindow: "Immediate",
      icon: <Calendar className="h-8 w-8 text-blue-500" />
    },
    {
      id: 2,
      title: "Priority Tea Harvesting",
      riskThreshold: 60,
      description: "Begin harvesting mature tea leaves ahead of schedule, focusing on fields on steep slopes first.",
      benefits: [
        "Secures high-quality tea leaf yield before potential damage",
        "Prevents access issues on hillside tea plantations",
        "Maintains tea quality by avoiding excess moisture absorption"
      ],
      urgency: "High",
      timeWindow: "Next 48 hours",
      icon: <Clock className="h-8 w-8 text-amber-500" />
    },
    {
      id: 3,
      title: "Clear Terraced Drainage",
      riskThreshold: 40,
      description: "Inspect and clear all terraced drainage systems, culverts and diversion channels common in Kericho's tea plantations.",
      benefits: [
        "Improves hillside drainage during heavy rainfall",
        "Preserves terrace structure and prevents collapse",
        "Protects lower fields from water cascading from higher elevations"
      ],
      urgency: "Medium",
      timeWindow: "Next 3 days",
      icon: <Droplets className="h-8 w-8 text-cyan-500" />
    },
    {
      id: 4,
      title: "Reinforce Tea Field Terraces",
      riskThreshold: 75,
      description: "Strengthen terraced embankments and create additional water diversion channels on steeper slopes.",
      benefits: [
        "Prevents terrace collapse during heavy downpours",
        "Protects valuable mature tea bushes from landslides",
        "Minimizes topsoil loss on Kericho's fertile slopes"
      ],
      urgency: "Critical",
      timeWindow: "Immediate",
      icon: <AlertTriangle className="h-8 w-8 text-red-500" />
    },
    {
      id: 5,
      title: "Relocate Farm Equipment",
      riskThreshold: 80,
      description: "Move tea processing equipment and vehicles to higher ground, away from low-lying areas and seasonal waterways.",
      benefits: [
        "Protects valuable processing machinery from water damage",
        "Ensures continued operation during flood events",
        "Prevents contamination of water sources with fuel or chemicals"
      ],
      urgency: "Critical",
      timeWindow: "Next 24 hours",
      icon: <AlertTriangle className="h-8 w-8 text-red-500" />
    }
  ];

  // Filter actions based on current flood risk
  const filteredActions = recommendedActions.filter(action => floodRisk >= action.riskThreshold);

  const handleLocationChange = (e: { target: { value: React.SetStateAction<string>; }; }) => {
    const selectedLocation = farmLocations.find(loc => loc.name === e.target.value);
    setLocation(e.target.value);
    if (selectedLocation) {
      setCoordinates({ lat: selectedLocation.lat, lon: selectedLocation.lon });
    }
    
    // Visual feedback for location change
    setTooltipContent(`Weather data updated for ${e.target.value}`);
    setShowTooltip(true);
    setTimeout(() => setShowTooltip(false), 3000);
  };
  
  const handleActionSelect = (action: React.SetStateAction<null>) => {
    setSelectedAction(action);
    setShowActionDetails(true);
  };
  
  const closeActionDetails = () => {
    setShowActionDetails(false);
    setTimeout(() => setSelectedAction(null), 500); // Wait for animation to complete
  };

  const handleManualRefresh = () => {
    // Trigger the same effect as the useEffect for coordinates change
    const event = new Event('refreshWeather');
    window.dispatchEvent(event);
    
    // Manually refresh by changing coordinates slightly and then back
    const jitter = 0.0001; // Small enough to not make a real difference
    setCoordinates(prev => ({ lat: prev.lat + jitter, lon: prev.lon + jitter }));
    setTimeout(() => {
      setCoordinates(prev => ({ lat: prev.lat - jitter, lon: prev.lon - jitter }));
    }, 100);
  };

  const getRiskColor = (risk: number) => {
    if (risk < 30) return 'bg-green-500';
    if (risk < 60) return 'bg-yellow-500';
    if (risk < 80) return 'bg-orange-500';
    return 'bg-red-500';
  };
  
  const getRiskText = (risk: number) => {
    if (risk < 30) return 'Low';
    if (risk < 60) return 'Moderate';
    if (risk < 80) return 'High';
    return 'Severe';
  };
  
  const getWeatherIcon = (iconType: string) => {
    switch(iconType) {
      case 'heavy-rain':
        return <CloudRain className="h-8 w-8 text-blue-700 animate-bounce-slow" />;
      case 'light-rain':
        return <CloudRain className="h-8 w-8 text-blue-500" />;
      case 'cloudy':
        return <Cloud className="h-8 w-8 text-gray-400" />;
      case 'sunny':
        return <Sun className="h-8 w-8 text-amber-500" />;
      case 'thunderstorm':
        return <CloudLightning className="h-8 w-8 text-purple-500" />;
      default:
        return <Cloud className="h-8 w-8 text-gray-400" />;
    }
  };
  
  const formatTimeAgo = (date: number | Date) => {
    const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
    
    if (seconds < 60) return `${seconds} seconds ago`;
    
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
    
    const hours = Math.floor(minutes / 60);
    return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 p-4 md:p-6 transition-all duration-500">
      {/* Toast notification */}
      <div 
        className={`fixed top-6 right-6 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg z-50 transition-all duration-300 transform ${
          showTooltip ? 'translate-y-0 opacity-100' : '-translate-y-4 opacity-0 pointer-events-none'
        }`}
      >
        <p>{tooltipContent}</p>
      </div>
      
      <header className="mb-6 md:mb-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="transition-all duration-500 hover:translate-x-1">
            <h1 className="text-3xl font-bold text-blue-800 flex items-center">
              <CloudRain className="mr-3 h-8 w-8 animate-bounce-slow" />
              <span className="bg-gradient-to-r from-blue-700 to-blue-500 text-transparent bg-clip-text">Farm Flood Risk Manager</span>
            </h1>
            <p className="text-blue-600 mt-1">Real-time flood monitoring for Kericho tea farms</p>
          </div>
          
          <div className="flex gap-3 w-full md:w-auto">
            <div className="bg-white rounded-lg shadow-md p-3 flex items-center w-full md:w-auto transition-all duration-300 hover:shadow-lg transform hover:-translate-y-1">
              <MapPin className="h-5 w-5 text-blue-500 mr-2" />
              <select 
                value={location}
                onChange={handleLocationChange}
                className="bg-transparent text-gray-800 font-medium focus:outline-none w-full"
              >
                {farmLocations.map(loc => (
                  <option key={loc.name} value={loc.name}>{loc.name}</option>
                ))}
              </select>
            </div>
            
            <button 
              onClick={handleManualRefresh}
              disabled={refreshAnimation || loadingData}
              className={`p-3 rounded-lg shadow-md bg-blue-50 hover:bg-blue-100 transition-all duration-300 ${
                (refreshAnimation || loadingData) ? 'cursor-not-allowed' : 'hover:-translate-y-1 hover:shadow-lg'
              }`}
            >
              <RefreshCw className={`h-5 w-5 text-blue-500 ${refreshAnimation ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
        
        <div className="flex items-center mt-2 text-sm text-blue-600">
          <Clock className="h-4 w-4 mr-1" />
          <span>Data updated: {formatTimeAgo(dataUpdatedTime)}</span>
          
          {locationStatus === "success" && (
            <div className="ml-4 flex items-center text-green-600">
              <MapPin className="h-4 w-4 mr-1" />
              <span>Location tracked</span>
            </div>
          )}
          
          {locationStatus === "loading" && (
            <div className="ml-4 flex items-center text-amber-600">
              <Loader className="h-4 w-4 mr-1 animate-spin" />
              <span>Locating...</span>
            </div>
          )}
        </div>
      </header>
      
      {loadingData ? (
        <div className="flex justify-center items-center h-64">
          <div className="flex flex-col items-center">
            <div className="relative">
              <Cloud className="h-16 w-16 text-blue-300" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            </div>
            <p className="mt-4 text-blue-500 font-medium animate-pulse">Loading weather data for Kericho...</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Risk Dashboard */}
          <div className="col-span-1 lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Current Weather Card */}
            <div className="bg-white rounded-xl shadow-md p-6 transition-all duration-500 hover:shadow-lg transform hover:-translate-y-1">
              <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                <div className="mr-2 relative">
                  {weather?.description.includes("Rain") ? (
                    <CloudRain className="h-5 w-5 text-blue-500" />
                  ) : weather?.description.includes("Cloud") ? (
                    <Cloud className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Sun className="h-5 w-5 text-amber-500" />
                  )}
                </div>
                Current Conditions
              </h2>
              
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <div className="flex items-center">
                    <ThermometerSun className="h-5 w-5 text-amber-500 mr-2" />
                    <span className="text-3xl font-bold text-gray-800">{weather?.temp}°C</span>
                  </div>
                  <p className="text-gray-600 mt-1 flex items-center">
                    {weather?.description}
                    {weather?.description.includes("Rain") && (
                      <span className="ml-1 inline-flex items-center">
                        <Droplets className="h-3 w-3 text-blue-500 animate-bounce-slow" />
                      </span>
                    )}
                  </p>
                  
                  <div className="mt-4 grid grid-cols-2 gap-4">
                    <div className="flex items-center">
                      <Droplets className="h-4 w-4 text-blue-500 mr-2" />
                      <span className="text-gray-700">{weather?.humidity}% Humidity</span>
                    </div>
                    <div className="flex items-center">
                      <Wind className="h-4 w-4 text-blue-500 mr-2" />
                      <span className="text-gray-700">{weather?.windSpeed} km/h</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-col items-center">
                  <div className="relative">
                    <CloudRain className="h-16 w-16 text-blue-500" />
                    {(weather?.precipitation ?? 0) > 10 && (
                      <div className="absolute -bottom-2 left-0 right-0 flex justify-center">
                        <div className="h-6 flex space-x-1">
                          {[...Array(3)].map((_, i) => (
                            <div 
                              key={i} 
                              className="w-px bg-blue-400 animate-rainfall" 
                              style={{ animationDelay: `${i * 0.2}s` }}
                            ></div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  <p className="mt-2 text-blue-800 font-medium">{weather?.precipitation} mm</p>
                  <p className="text-sm text-gray-600">Precipitation</p>
                </div>
              </div>
            </div>
            
            {/* Flood Risk Indicator */}
            <div 
              ref={riskIndicatorRef}
              className="bg-white rounded-xl shadow-md p-6 transition-all duration-500 hover:shadow-lg transform hover:-translate-y-1"
            >
              <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                <AlertTriangle className={`h-5 w-5 mr-2 ${floodRisk >= 60 ? 'text-red-500' : 'text-amber-500'}`} />
                Flood Risk Assessment
              </h2>
              
              <div className="flex items-center justify-between mb-4">
                <div className="w-full">
                  <div className="flex justify-between mb-1">
                    <span className="font-medium text-gray-700">Risk Level</span>
                    <span className={`font-semibold ${floodRisk >= 80 ? 'text-red-600' : floodRisk >= 60 ? 'text-orange-500' : floodRisk >= 30 ? 'text-yellow-600' : 'text-green-600'}`}>
                      {getRiskText(floodRisk)}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                    <div 
                      className={`${getRiskColor(floodRisk)} h-4 rounded-full transition-all duration-1000 ease-in-out`} 
                      style={{ width: `${floodRisk}%` }}
                    >
                      {floodRisk > 70 && (
                        <div className="h-full w-full bg-opacity-30 bg-white animate-pulse-fast"></div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="w-full">
                  <div className="flex justify-between mb-1">
                    <span className="font-medium text-gray-700">Soil Moisture</span>
                    <span className="font-semibold text-blue-600">{soilMoisture}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                    <div 
                      className="bg-blue-500 h-4 rounded-full transition-all duration-1000 ease-in-out" 
                      style={{ width: `${soilMoisture}%` }}
                    >
                      <div className="h-full w-full opacity-75 overflow-hidden relative">
                        <div className="absolute inset-0 bg-wave-pattern animate-wave"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {floodRisk > 60 && (
                <div className="mt-4 text-sm text-red-600 bg-red-50 p-2 rounded-lg border border-red-100 flex items-start">
                  <AlertTriangle className="h-4 w-4 mr-2 flex-shrink-0 mt-0.5" />
                  <span>Hillside tea farms in Kericho are at elevated risk due to saturated soil on sloped terrain.</span>
                </div>
              )}
              </div>
            
            {/* 7-Day Forecast */}
            <div className="bg-white rounded-xl shadow-md p-6 transition-all duration-500 hover:shadow-lg transform hover:-translate-y-1 md:col-span-2">
              <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                <Calendar className="h-5 w-5 text-blue-500 mr-2" />
                7-Day Forecast
              </h2>
              
              <div className="overflow-x-auto pb-2">
                <div className="flex space-x-4 min-w-max">
                  {forecast.map((day, index) => (
                    <div 
                      key={index} 
                      className={`flex-shrink-0 flex flex-col items-center p-4 rounded-lg transition-all duration-500 transform hover:scale-105 ${
                        index < 3 && day.precipChance > 50 ? 
                          'bg-blue-50 border border-blue-200 shadow-sm' : 
                          'hover:bg-gray-50'
                      }`}
                    >
                      <p className="font-medium text-gray-800">{day.date}</p>
                      <div className="my-3 relative">
                        {getWeatherIcon(day.icon)}
                        {day.precipChance > 70 && (
                          <div className="absolute -bottom-2 left-0 right-0 flex justify-center">
                            <div className="h-4 flex space-x-1">
                              {[...Array(3)].map((_, i) => (
                                <div 
                                  key={i} 
                                  className="w-px bg-blue-400 animate-rainfall" 
                                  style={{ animationDelay: `${i * 0.2}s`, height: `${Math.random() * 8 + 4}px` }}
                                ></div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                      <p className="font-bold text-gray-800">{day.temp}°C</p>
                      <div className="mt-2 flex items-center">
                        <Droplets className={`h-4 w-4 mr-1 ${
                          day.precipChance > 50 ? 'text-blue-600' : 'text-blue-400'
                        }`} />
                        <span className={`text-sm ${
                          day.precipChance > 70 ? 'text-blue-700 font-medium' : 
                          day.precipChance > 50 ? 'text-blue-600' : 
                          'text-gray-600'
                        }`}>
                          {day.precipChance}%
                        </span>
                      </div>
                      {day.precipChance > 70 && index < 3 && (
                        <span className="mt-2 px-2 py-1 bg-red-100 text-red-600 text-xs rounded-full font-medium animate-pulse">
                          High Risk
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            {/* Precipitation History Chart */}
            <div 
              ref={precipChartRef}
              className="bg-white rounded-xl shadow-md p-6 transition-all duration-500 hover:shadow-lg md:col-span-2 transform hover:-translate-y-1"
            >
              <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                <Umbrella className="h-5 w-5 text-blue-500 mr-2" />
                Precipitation History (Last 14 Days)
              </h2>
              
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={precipHistory}
                    margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
                  >
                    <defs>
                      <linearGradient id="precipColorArea" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                    <XAxis 
                      dataKey="date" 
                      tick={{fill: '#4b5563'}}
                      axisLine={{stroke: '#e5e7eb'}}
                    />
                    <YAxis 
                      label={{ value: 'mm', angle: -90, position: 'insideLeft', fill: '#4b5563' }} 
                      tick={{fill: '#4b5563'}}
                      axisLine={{stroke: '#e5e7eb'}}
                    />
                    <Tooltip 
                      formatter={(value: any) => [`${value} mm`, 'Precipitation']}
                      contentStyle={{
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        borderRadius: '0.5rem',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                        border: '1px solid #e5e7eb'
                      }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="amount" 
                      stroke="#3b82f6" 
                      fill="url(#precipColorArea)" 
                      animationDuration={2000}
                      animationEasing="ease-in-out"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              
              {/* Regional context for Kericho precipitation */}
              <div className="mt-3 text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">
                <p className="font-medium text-blue-800 mb-1">Kericho Rainfall Context</p>
                <p>Tea farms in the highlands receive {new Date().getMonth() >= 2 && new Date().getMonth() <= 4 ? 'heavy' : 'moderate'} rainfall during this season, with average monthly precipitation of 100-200mm.</p>
              </div>
            </div>
          </div>
          
          {/* Recommendations Panel */}
          <div className="col-span-1 flex flex-col gap-6">
            <div className="bg-white rounded-xl shadow-md p-6 transition-all duration-500 hover:shadow-lg transform hover:-translate-y-1">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                <span className="flex items-center">
                  <AlertTriangle className="h-5 w-5 text-amber-500 mr-2" />
                  Recommended Actions for Tea Farms
                </span>
              </h2>
              
              {filteredActions.length > 0 ? (
                <div className="space-y-4">
                  {filteredActions.map((action, index) => (
                    <div
                      key={action.id}
                      className="p-4 rounded-lg border border-blue-100 bg-blue-50 cursor-pointer transition-all duration-300 hover:bg-blue-100 hover:shadow transform hover:-translate-y-1 hover:translate-x-1"
                      onClick={() => handleActionSelect(action)}
                      style={{ animationDelay: `${index * 0.1}s` }}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center">
                          {action.icon}
                          <div className="ml-3">
                            <h3 className="font-medium text-blue-800">{action.title}</h3>
                            <p className="text-sm text-blue-600 flex items-center">
                              <span className={`inline-block w-2 h-2 rounded-full mr-1 ${
                                action.urgency === 'Critical' ? 'bg-red-500 animate-pulse' : 
                                action.urgency === 'High' ? 'bg-orange-500' : 
                                'bg-yellow-500'
                              }`}></span>
                              Urgency: {action.urgency}
                            </p>
                          </div>
                        </div>
                        <ChevronRight className="h-5 w-5 text-blue-500 transition-transform duration-300 group-hover:translate-x-1" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 transition-all duration-500 animate-fade-in">
                  <div className="bg-green-100 rounded-full p-3 inline-flex mb-3">
                    <Sun className="h-8 w-8 text-green-500" />
                  </div>
                  <p className="text-gray-600">No immediate actions needed</p>
                  <p className="text-sm text-gray-500 mt-1">Continue normal tea farm operations</p>
                </div>
              )}
            </div>
            
            {/* Regional Weather Alerts */}
            {floodRisk > 70 && (
              <div className="bg-red-50 border border-red-200 rounded-xl shadow-md p-6 animate-pulse-slow transition-all duration-500 transform hover:-translate-y-1 hover:shadow-lg">
                <div className="flex items-start">
                  <AlertTriangle className="h-6 w-6 text-red-500 mr-3 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-red-800">Kericho Flood Warning Active</h3>
                    <p className="text-red-700 mt-1">Heavy precipitation expected over tea growing highlands. Hillside farms at elevated risk of slope failure and water damage.</p>
                    <ul className="mt-2 text-sm text-red-600 space-y-1">
                      <li className="flex items-start">
                        <span className="mr-1">•</span>
                        <span>High risk areas: Kipkelion, Londiani slopes</span>
                      </li>
                      <li className="flex items-start">
                        <span className="mr-1">•</span>
                        <span>Expected rainfall: 40-60mm in next 24hrs</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            )}
            
            {/* Kericho-specific Tea Farming Tips */}
            <div className="bg-white rounded-xl shadow-md p-6 transition-all duration-500 hover:shadow-lg transform hover:-translate-y-1">
              <h2 className="text-lg font-semibold text-gray-800 mb-3">Tea Farming Weather Tips</h2>
              
              <div className="space-y-3">
                <div className="p-3 rounded-lg bg-green-50 border border-green-100">
                  <p className="text-sm text-green-800">
                    <span className="font-medium block mb-1">Optimal Harvesting Conditions:</span>
                    Tea quality is highest when harvested in non-rainy periods. Consider early morning harvesting before afternoon rains.
                  </p>
                </div>
                
                <div className="p-3 rounded-lg bg-amber-50 border border-amber-100">
                  <p className="text-sm text-amber-800">
                    <span className="font-medium block mb-1">Terrace Maintenance:</span>
                    Regular inspection of terraced fields is crucial during high rainfall seasons in Kericho highlands.
                  </p>
                </div>
                
                <div className="p-3 rounded-lg bg-blue-50 border border-blue-100">
                  <p className="text-sm text-blue-800">
                    <span className="font-medium block mb-1">Weather Patterns:</span>
                    Kericho typically experiences two rainy seasons: March-May (long) and October-November (short).
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Action Detail Modal with Enhanced Animations */}
      {selectedAction && (
        <div 
          className={`fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 transition-opacity duration-300 ${
            showActionDetails ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
          onClick={closeActionDetails}
        >
          <div 
            className={`bg-white rounded-xl p-6 max-w-lg w-full mx-4 transition-all duration-500 ${
              showActionDetails ? 'scale-100 translate-y-0' : 'scale-95 translate-y-8'
            }`}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center">
                {selectedAction.icon}
                <h2 className="text-xl font-semibold text-gray-800 ml-3">{selectedAction.title}</h2>
              </div>
              <button 
                onClick={closeActionDetails}
                className="p-2 rounded-full hover:bg-gray-100 transition-colors"
              >
                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="mb-4 bg-blue-50 p-3 rounded-lg">
              <div className="flex justify-between mb-2">
                <span className="text-gray-600">Urgency:</span>
                <span className={`font-medium ${
                  selectedAction.urgency === 'Critical' ? 'text-red-600' : 
                  selectedAction.urgency === 'High' ? 'text-orange-600' : 
                  'text-yellow-600'
                }`}>
                  {selectedAction.urgency}
                  {selectedAction.urgency === 'Critical' && (
                    <span className="ml-1 inline-block w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
                  )}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Time Window:</span>
                <span className="font-medium text-blue-600">{selectedAction.timeWindow}</span>
              </div>
            </div>
            
            <p className="text-gray-700 mb-4">{selectedAction.description}</p>
            
            <div className="mb-4">
              <h3 className="font-medium text-gray-800 mb-2">Benefits for Kericho Tea Farms:</h3>
              <ul className="space-y-2">
                {selectedAction.benefits.map((benefit: string | number | bigint | boolean | React.ReactElement<unknown, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | React.ReactPortal | Promise<string | number | bigint | boolean | React.ReactPortal | React.ReactElement<unknown, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | null | undefined> | null | undefined, index: React.Key | null | undefined) => (
                  <li 
                    key={index} 
                    className="flex items-start rounded-lg p-2 hover:bg-blue-50 transition-colors"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <svg className="w-5 h-5 text-green-500 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-gray-700">{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="flex space-x-3">
              <button 
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-all duration-300 transform hover:translate-y-1 hover:shadow-lg"
                onClick={closeActionDetails}
              >
                Implement Action
              </button>
              
              <button 
                className="flex-1 bg-white border border-blue-300 text-blue-600 font-medium py-2 px-4 rounded-lg transition-colors hover:bg-blue-50"
                onClick={closeActionDetails}
              >
                Remind Later
              </button>
            </div>
          </div>
        </div>
      )}
      
      <footer className="mt-12 text-center text-gray-500 text-sm">
        <p>Data refreshed automatically • Powered by OpenWeather API</p>
        <p className="mt-1">Kericho Tea Farm Flood Risk Manager © 2025</p>
        
        {/* Add CSS for custom animations */}
        <style jsx>{`
          @keyframes rainfall {
            0% { transform: translateY(-10px); opacity: 0; }
            50% { opacity: 0.7; }
            100% { transform: translateY(10px); opacity: 0; }
          }
          
          @keyframes bounce-slow {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-5px); }
          }
          
          @keyframes pulse-fast {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.6; }
          }
          
          @keyframes wave {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
          }
          
          @keyframes fade-in {
            0% { opacity: 0; transform: translateY(10px); }
            100% { opacity: 1; transform: translateY(0); }
          }
          
          @keyframes pulse-slow {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.8; }
          }
          
          .animate-rainfall {
            animation: rainfall 1.5s infinite;
          }
          
          .animate-bounce-slow {
            animation: bounce-slow 3s infinite ease-in-out;
          }
          
          .animate-pulse-fast {
            animation: pulse-fast 0.8s infinite;
          }
          
          .animate-wave {
            animation: wave 4s infinite linear;
          }
          
          .animate-fade-in {
            animation: fade-in 0.8s ease-out;
          }
          
          .animate-pulse-slow {
            animation: pulse-slow 2s infinite;
          }
          
          .bg-wave-pattern {
            background: linear-gradient(90deg, 
              rgba(255,255,255,0.3) 0%, 
              rgba(255,255,255,0.6) 50%, 
              rgba(255,255,255,0.3) 100%);
            width: 200%;
          }
        `}</style>
      </footer>
    </div>
  );
}