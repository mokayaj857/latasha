import React, { useState, useEffect } from 'react';
// import { motion, AnimatePresence } from 'framer-motion';
// import { useSpring, animated } from '@lucide-react/spring';
import Lottie from 'react-lottie';


// Types
interface WeatherData {
  temp: number;
  humidity: number;
  rainfall: number;
  floodRisk: 'low' | 'medium' | 'high';
}

interface Recommendation {
  id: number;
  action: string;
  urgency: 'low' | 'medium' | 'high';
  details: string;
}

const FloodAvertDashboard: React.FC = () => {
  // State
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [selectedTab, setSelectedTab] = useState<'map' | 'alerts' | 'forecast'>('map');
  const [isLoading, setIsLoading] = useState(true);

  // Fetch real-time weather data (simulated API call)
  useEffect(() => {
    const fetchWeatherData = async () => {
      setIsLoading(true);
      
      // Simulate API call to OpenWeather
      setTimeout(() => {
        setWeather({
          temp: 22,
          humidity: 85,
          rainfall: 45,
          floodRisk: 'high'
        });
        
        setRecommendations([
          { id: 1, action: "Harvest wheat early", urgency: 'high', details: "Expected heavy rain in 3 days may flood fields" },
          { id: 2, action: "Delay corn planting", urgency: 'medium', details: "Soil saturation too high for new crops" },
          { id: 3, action: "Move livestock to higher ground", urgency: 'low', details: "Low-lying areas at risk next week" }
        ]);
        
        setIsLoading(false);
      }, 1500);
    };

    fetchWeatherData();
    const interval = setInterval(fetchWeatherData, 300000); // Refresh every 5 mins
    return () => clearInterval(interval);
  }, []);

  // Animation props
  const riskMeterSpring = useSpring({
    value: weather?.floodRisk === 'high' ? 100 : weather?.floodRisk === 'medium' ? 60 : 30,
    from: { value: 0 },
    config: { tension: 120, friction: 14 }
  });

  // Lottie animation options
  const weatherAnimOptions = {
    loop: true,
    autoplay: true,
    animationData: weatherAnim,
    rendererSettings: {
      preserveAspectRatio: 'xMidYMid slice'
    }
  };

  return (
    <div className="dashboard">
      {/* Header */}
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <h1>FloodAvert</h1>
        <div className="risk-indicator">
          <span>Current Risk:</span>
          <motion.div
            className={`risk-level ${weather?.floodRisk || 'low'}`}
            whileHover={{ scale: 1.05 }}
          >
            {weather?.floodRisk.toUpperCase() || 'LOADING...'}
          </motion.div>
        </div>
      </motion.header>

      {/* Main Content */}
      <main>
        {/* Navigation Tabs */}
        <nav className="tabs">
          {(['map', 'alerts', 'forecast'] as const).map((tab) => (
            <motion.button
              key={tab}
              className={selectedTab === tab ? 'active' : ''}
              onClick={() => setSelectedTab(tab)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
              {selectedTab === tab && (
                <motion.div
                  className="underline"
                  layoutId="underline"
                  initial={false}
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                />
              )}
            </motion.button>
          ))}
        </nav>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={selectedTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="tab-content"
          >
            {isLoading ? (
              <div className="loading">
                <Lottie options={weatherAnimOptions} height={200} width={200} />
                <p>Fetching real-time flood data...</p>
              </div>
            ) : (
              <>
                {selectedTab === 'map' && (
                  <div className="map-container">
                    <h2>Flood Risk Map</h2>
                    <div className="map-visualization">
                      {/* Simulated map with animated water levels */}
                      <div className="map-base">
                        <motion.div
                          className="water-overlay"
                          initial={{ height: '0%' }}
                          animate={{
                            height: weather?.floodRisk === 'high' ? '65%' : 
                                   weather?.floodRisk === 'medium' ? '35%' : '10%'
                          }}
                          transition={{ type: 'spring', damping: 10 }}
                        />
                      </div>
                      <div className="map-legend">
                        <div className="legend-item">
                          <span className="low"></span> Low Risk
                        </div>
                        <div className="legend-item">
                          <span className="medium"></span> Medium Risk
                        </div>
                        <div className="legend-item">
                          <span className="high"></span> High Risk
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {selectedTab === 'alerts' && (
                  <div className="recommendations">
                    <h2>Action Recommendations</h2>
                    <div className="risk-meter">
                      <h3>Flood Risk Level</h3>
                      <div className="meter-container">
                        <animated.div
                          className="meter-fill"
                          style={{
                            width: riskMeterSpring.value.to(v => `${v}%`)
                          }}
                        />
                      </div>
                    </div>
                    <div className="recommendations-list">
                      {recommendations.map((rec) => (
                        <motion.div
                          key={rec.id}
                          className={`recommendation ${rec.urgency}`}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: rec.id * 0.1 }}
                          whileHover={{ scale: 1.02 }}
                        >
                          <h3>{rec.action}</h3>
                          <p>{rec.details}</p>
                          <button className="action-button">
                            Mark as Done
                          </button>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedTab === 'forecast' && (
                  <div className="forecast">
                    <h2>7-Day Flood Forecast</h2>
                    <div className="forecast-cards">
                      {Array.from({ length: 7 }).map((_, i) => (
                        <motion.div
                          key={i}
                          className="forecast-card"
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.1 }}
                          whileHover={{ y: -5 }}
                        >
                          <h3>Day {i + 1}</h3>
                          <div className="weather-icon">
                            {i % 3 === 0 ? '🌧️' : i % 2 === 0 ? '⛅' : '☀️'}
                          </div>
                          <p>Rain: {i % 3 === 0 ? 'Heavy' : 'Light'} mm</p>
                          <div className={`risk-badge ${
                            i % 3 === 0 ? 'high' : i % 2 === 0 ? 'medium' : 'low'
                          }`}>
                            {i % 3 === 0 ? 'HIGH RISK' : i % 2 === 0 ? 'MEDIUM' : 'LOW'}
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Emergency FAB */}
      <motion.button
        className="emergency-fab"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
      >
        🆘 Emergency Contacts
      </motion.button>
    </div>
  );
};

export default FloodAvertDashboard;