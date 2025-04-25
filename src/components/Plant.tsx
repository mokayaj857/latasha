import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar as CalendarIcon,
  Droplets,
  Thermometer,
  CloudRain,
  Sun,
  Cloud,
  CloudLightning,
  CloudSnow,
  Wind,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

interface DailyForecast {
  dt: number;
  temp: {
    day: number;
    min: number;
    max: number;
  };
  weather: {
    id: number;
    main: string;
    description: string;
    icon: string;
  }[];
  pop: number;
  rain?: number;
  snow?: number;
  humidity: number;
  wind_speed: number;
}

const WeatherCalendar = () => {
  const [forecast, setForecast] = useState<DailyForecast[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<DailyForecast | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const calendarRef = useRef<HTMLDivElement>(null);
  const API_KEY = 'f0bb40f2b7926ef137fa37dd1170ea84';
  const KERICHO_COORDS = { lat: -0.3670, lon: 35.2831 };

  // Fetch weather data
  useEffect(() => {
    const fetchWeather = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(
          `https://api.openweathermap.org/data/2.5/onecall?lat=${KERICHO_COORDS.lat}&lon=${KERICHO_COORDS.lon}&exclude=current,minutely,hourly,alerts&units=metric&appid=${API_KEY}`
        );
        const data = await response.json();
        setForecast(data.daily.slice(0, 14)); // 2 weeks forecast
        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching weather:", error);
        setIsLoading(false);
      }
    };

    fetchWeather();
  }, [currentMonth]);

  // Calendar animation on month change
  const handleMonthChange = (direction: 'prev' | 'next') => {
    if (calendarRef.current) {
      calendarRef.current.animate([
        { opacity: 1, transform: 'translateX(0)' },
        { opacity: 0, transform: `translateX(${direction === 'prev' ? '-' : ''}20px)` }
      ], {
        duration: 300,
        easing: 'ease-in-out'
      }).onfinish = () => {
        setCurrentMonth(prev => {
          const newDate = new Date(prev);
          newDate.setMonth(newDate.getMonth() + (direction === 'prev' ? -1 : 1));
          return newDate;
        });
      };
    }
  };

  // Get weather icon with animations
  const getWeatherIcon = (iconCode: string, size = 24) => {
    const iconProps = { size, className: "flex-shrink-0" };
    const animatedProps = {
      initial: { scale: 0.8, rotate: -10 },
      animate: { scale: 1, rotate: 0 },
      transition: { type: 'spring', stiffness: 300 }
    };

    switch (iconCode.slice(0, 2)) {
      case '01': return <motion.div {...animatedProps}><Sun {...iconProps} className="text-yellow-400 animate-pulse" /></motion.div>;
      case '02': return <motion.div {...animatedProps}><Cloud {...iconProps} className="text-gray-400" /></motion.div>;
      case '03': return <motion.div {...animatedProps}><Cloud {...iconProps} className="text-gray-500" /></motion.div>;
      case '04': return <motion.div {...animatedProps}><Cloud {...iconProps} className="text-gray-600" /></motion.div>;
      case '09': return <motion.div {...animatedProps}><CloudRain {...iconProps} className="text-blue-500 animate-bounce" /></motion.div>;
      case '10': return <motion.div {...animatedProps}><CloudRain {...iconProps} className="text-blue-600 animate-rain" /></motion.div>;
      case '11': return <motion.div {...animatedProps}><CloudLightning {...iconProps} className="text-purple-600 animate-flash" /></motion.div>;
      case '13': return <motion.div {...animatedProps}><CloudSnow {...iconProps} className="text-blue-200" /></motion.div>;
      default: return <motion.div {...animatedProps}><Cloud {...iconProps} /></motion.div>;
    }
  };

  // Generate calendar days
  const generateCalendarDays = () => {
    const startDate = new Date(currentMonth);
    startDate.setDate(1);
    const endDate = new Date(currentMonth);
    endDate.setMonth(endDate.getMonth() + 1);
    endDate.setDate(0);

    const days = [];
    const today = new Date();

    // Add previous month's days if needed
    const startDay = startDate.getDay();
    for (let i = 0; i < startDay; i++) {
      days.push(null);
    }

    // Add current month's days
    for (let i = 1; i <= endDate.getDate(); i++) {
      const date = new Date(currentMonth);
      date.setDate(i);
      days.push(date);
    }

    return days.map((date, index) => {
      if (!date) return <div key={`empty-${index}`} className="h-16"></div>;

      const forecastForDay = forecast.find(f => {
        const forecastDate = new Date(f.dt * 1000);
        return forecastDate.getDate() === date.getDate() && 
               forecastDate.getMonth() === date.getMonth();
      });

      const isToday = date.getDate() === today.getDate() && 
                      date.getMonth() === today.getMonth();

      return (
        <motion.button
          key={date.toString()}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: index * 0.02 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => forecastForDay && setSelectedDay(forecastForDay)}
          className={`h-16 p-1 rounded-xl flex flex-col items-center justify-center border-2 ${
            isToday ? 'border-blue-400 bg-blue-50' : 
            forecastForDay ? 'border-gray-100 hover:border-gray-200' : 
            'border-transparent'
          }`}
        >
          <div className="text-xs font-medium mb-1">
            {date.getDate()}
          </div>
          {forecastForDay ? (
            <>
              {getWeatherIcon(forecastForDay.weather[0].icon, 20)}
              <div className="flex text-xs mt-1">
                <span className="text-blue-600">{Math.round(forecastForDay.temp.min)}°</span>
                <span className="mx-1">-</span>
                <span className="text-red-500">{Math.round(forecastForDay.temp.max)}°</span>
              </div>
            </>
          ) : (
            <div className="text-gray-300 text-xs">N/A</div>
          )}
        </motion.button>
      );
    });
  };

  return (
    <div className="max-w-3xl mx-auto p-4">
      {/* Calendar Header */}
      <motion.div 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="flex items-center justify-between mb-6 bg-gradient-to-r from-blue-500 to-blue-600 p-4 rounded-xl text-white shadow-lg"
      >
        <button 
          onClick={() => handleMonthChange('prev')}
          className="p-2 rounded-full hover:bg-blue-400 transition-colors"
        >
          <ChevronLeft />
        </button>
        <h2 className="text-xl font-bold">
          {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </h2>
        <button 
          onClick={() => handleMonthChange('next')}
          className="p-2 rounded-full hover:bg-blue-400 transition-colors"
        >
          <ChevronRight />
        </button>
      </motion.div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-2 mb-2">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="text-center text-sm font-medium text-gray-500">
            {day}
          </div>
        ))}
      </div>

      <motion.div
        ref={calendarRef}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="grid grid-cols-7 gap-2"
      >
        {isLoading ? (
          <div className="col-span-7 flex justify-center py-8">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
              className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full"
            />
          </div>
        ) : (
          generateCalendarDays()
        )}
      </motion.div>

      {/* Selected Day Details */}
      <AnimatePresence>
        {selectedDay && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ type: 'spring', stiffness: 300 }}
            className="mt-6 bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100"
          >
            <div className="p-4 bg-gradient-to-r from-blue-50 to-blue-100">
              <h3 className="text-lg font-bold text-gray-800">
                {new Date(selectedDay.dt * 1000).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
              </h3>
              <div className="flex items-center mt-1">
                {getWeatherIcon(selectedDay.weather[0].icon, 32)}
                <span className="ml-2 text-gray-700 capitalize">
                  {selectedDay.weather[0].description}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 p-4">
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="flex items-center text-gray-700">
                  <Thermometer className="mr-2 text-red-500" size={18} />
                  <span>Temperature</span>
                </div>
                <div className="mt-2 text-2xl font-bold">
                  {Math.round(selectedDay.temp.day)}°C
                </div>
                <div className="text-sm text-gray-600 mt-1">
                  <span className="text-blue-600">{Math.round(selectedDay.temp.min)}°</span> /{' '}
                  <span className="text-red-500">{Math.round(selectedDay.temp.max)}°</span>
                </div>
              </div>

              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="flex items-center text-gray-700">
                  <Droplets className="mr-2 text-blue-500" size={18} />
                  <span>Precipitation</span>
                </div>
                <div className="mt-2 text-2xl font-bold">
                  {Math.round((selectedDay.pop || 0) * 100)}%
                </div>
                <div className="text-sm text-gray-600 mt-1">
                  {selectedDay.rain ? `${selectedDay.rain}mm rain` : 
                   selectedDay.snow ? `${selectedDay.snow}mm snow` : 'No precipitation'}
                </div>
              </div>

              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="flex items-center text-gray-700">
                  <Droplets className="mr-2 text-blue-300" size={18} />
                  <span>Humidity</span>
                </div>
                <div className="mt-2 text-2xl font-bold">
                  {selectedDay.humidity}%
                </div>
                <div className="text-sm text-gray-600 mt-1">
                  {selectedDay.humidity > 80 ? 'Very humid' : 
                   selectedDay.humidity > 60 ? 'Moderate' : 'Low humidity'}
                </div>
              </div>

              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="flex items-center text-gray-700">
                  <Wind className="mr-2 text-gray-500" size={18} />
                  <span>Wind</span>
                </div>
                <div className="mt-2 text-2xl font-bold">
                  {Math.round(selectedDay.wind_speed)} m/s
                </div>
                <div className="text-sm text-gray-600 mt-1">
                  {selectedDay.wind_speed > 10 ? 'Strong winds' : 
                   selectedDay.wind_speed > 5 ? 'Breezy' : 'Calm'}
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-gray-100">
              <button 
                onClick={() => setSelectedDay(null)}
                className="w-full py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
              >
                Close Details
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add custom animations to CSS */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-3px); }
        }
        @keyframes flash {
          0%, 50%, 100% { opacity: 1; }
          25%, 75% { opacity: 0.5; }
        }
        @keyframes rain {
          0% { transform: translateY(-2px); }
          100% { transform: translateY(2px); }
        }
        .animate-pulse {
          animation: pulse 2s infinite;
        }
        .animate-bounce {
          animation: bounce 1.5s infinite;
        }
        .animate-flash {
          animation: flash 2s infinite;
        }
        .animate-rain {
          animation: rain 0.5s infinite alternate;
        }
      `}</style>
    </div>
  );
};

export default WeatherCalendar;