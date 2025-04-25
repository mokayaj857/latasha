import React, { useEffect, useState } from 'react';


interface WeatherData {
  temperature: number;
  description: string;
  icon: string;
  forecast: { date: string; temp: number; icon: string }[];
}

const WeatherWidget: React.FC = () => {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const API_KEY = 'f0bb40f2b7926ef137fa37dd1170ea84'; // 🔑 Replace with your OpenWeatherMap API key
  const LAT = -0.367;
  const LON = 35.283;

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        const response = await fetch(
          `https://api.openweathermap.org/data/2.5/forecast?lat=${LAT}&lon=${LON}&units=metric&appid=${API_KEY}`
        );
        const data = await response.json();

        const current = data.list[0];
        const forecast = data.list
          .filter((_: any, index: number) => index % 8 === 0)
          .slice(1, 6)
          .map((item: any) => ({
            date: new Date(item.dt * 1000).toLocaleDateString(),
            temp: item.main.temp,
            icon: item.weather[0].icon,
          }));

        setWeather({
          temperature: current.main.temp,
          description: current.weather[0].description,
          icon: current.weather[0].icon,
          forecast,
        });
        setLoading(false);
      } catch (err) {
        setError('Failed to fetch weather data.');
        setLoading(false);
      }
    };

    fetchWeather();
  }, []);

  if (loading) return <div className="text-sm text-gray-500">Loading weather...</div>;
  if (error) return <div className="text-red-600 text-sm">{error}</div>;

  return (
    <div className="absolute top-4 right-4 z-[999] bg-white bg-opacity-90 shadow-lg border border-emerald-500 rounded-xl p-4 w-[260px]">
      <h3 className="text-lg font-semibold text-emerald-700 mb-2">
        🌦️ Kericho Weather
      </h3>
      <div className="flex items-center gap-3 mb-4">
        <img
          src={`https://openweathermap.org/img/wn/${weather?.icon}@2x.png`}
          alt={weather?.description}
          className="w-12 h-12"
        />
        <div>
          <p className="capitalize text-gray-700 text-sm">{weather?.description}</p>
          <p className="text-2xl font-bold text-emerald-700">{weather?.temperature}°C</p>
        </div>
      </div>

      <h4 className="text-sm font-semibold text-gray-600 mb-2">5-Day Forecast</h4>
      <div className="grid grid-cols-5 gap-1 text-center text-xs text-gray-600">
        {weather?.forecast.map((day, index) => (
          <div key={index} className="flex flex-col items-center">
            <span className="font-semibold">{day.date.split('/')[1]}/{day.date.split('/')[0]}</span>
            <img
              src={`https://openweathermap.org/img/wn/${day.icon}.png`}
              alt=""
              className="w-6 h-6"
            />
            <span className="text-[0.75rem]">{day.temp}°C</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default WeatherWidget;
