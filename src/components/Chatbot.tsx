import React, { useState, useEffect, useRef } from 'react';
import { Navigate } from 'react-router-dom';

import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import { 
  Droplets, Home, Calendar, Map, Cloud, Settings, Menu, X, Sun, Moon, 
  ChevronRight, Bell, LogOut, ArrowRight
} from 'lucide-react';

// Import your existing components (these are just references, you already have the implementations)
// import CalendarPlanner from './features/CalendarPlanner';
// import FloodRiskManager from './features/FloodRiskManager';
// import FarmMap from './features/FarmMap';
// import WeatherRecommendations from './features/WeatherRecommendations';
// import SettingsPanel from './features/SettingsPanel';

const HomePage = () => {
  // States
  const [activeSection, setActiveSection] = useState('home');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [notifications, setNotifications] = useState([
    { id: 1, message: "Flood risk increased in North Field", type: "warning", read: false },
    { id: 2, message: "Weather forecast updated", type: "info", read: false },
  ]);
  const [showNotificationPanel, setShowNotificationPanel] = useState(false);
  const [unreadCount, setUnreadCount] = useState(2);
  const [rainDrops, setRainDrops] = useState([]);
  const [heroRotation, setHeroRotation] = useState({ x: 0, y: 0 });
  
  // Refs
  const heroRef = useRef(null);
  
  // Animations
  const controls = useAnimation();
  const weatherControls = useAnimation();
  const notificationBadgeControls = useAnimation();

  // Initialize loading animation
  useEffect(() => {
    setTimeout(() => {
      setIsLoading(false);
    }, 2000);
    
    // Create rain drops for background effect
    const drops = Array.from({ length: 50 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: -20,
      size: Math.random() * 2 + 1,
      speed: Math.random() * 3 + 2,
      delay: Math.random() * 5
    }));
    setRainDrops(drops);
    
    // Pulse notification badge if unread notifications
    if (unreadCount > 0) {
      notificationBadgeControls.start({
        scale: [1, 1.2, 1],
        transition: { repeat: Infinity, duration: 2 }
      });
    }
    
    // Start weather animations
    weatherControls.start({
      y: [0, -10, 0],
      transition: { repeat: Infinity, duration: 3, ease: "easeInOut" }
    });
    
    // Initial animations for page load
    controls.start({
      opacity: 1,
      y: 0,
      transition: { duration: 0.8, ease: "easeOut" }
    });
  }, []);
  
  // Handle 3D rotation effect on hero section
  useEffect(() => {
    if (!heroRef.current) return;
    
    const handleMouseMove = (e) => {
      const rect = heroRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      
      const rotateX = (y - centerY) / 40;
      const rotateY = (centerX - x) / 40;
      
      setHeroRotation({ x: rotateX, y: rotateY });
    };
    
    const heroElement = heroRef.current;
    heroElement.addEventListener('mousemove', handleMouseMove);
    
    return () => {
      heroElement.removeEventListener('mousemove', handleMouseMove);
    };
  }, [heroRef]);
  
  // Handle marking notifications as read
  const handleNotificationClick = (id) => {
    setNotifications(prevNotifications => 
      prevNotifications.map(notif => 
        notif.id === id ? { ...notif, read: true } : notif
      )
    );
    
    const updatedUnreadCount = notifications.filter(n => !n.read && n.id !== id).length;
    setUnreadCount(updatedUnreadCount);
    
    if (updatedUnreadCount === 0) {
      notificationBadgeControls.stop();
    }
  };
  
  // Variants for animations
  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { 
        when: "beforeChildren",
        staggerChildren: 0.1
      }
    }
  };
  
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };
  
  const menuItemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: i => ({
      opacity: 1,
      x: 0,
      transition: { delay: i * 0.1 }
    }),
    hover: { x: 5, transition: { duration: 0.2 } }
  };
  
  const rainDropVariants = {
    hidden: { y: -20, opacity: 0 },
    visible: (drop) => ({
      y: ['0vh', '100vh'],
      opacity: [0.7, 0],
      transition: {
        y: { 
          repeat: Infinity, 
          duration: drop.speed, 
          ease: "linear",
          delay: drop.delay
        },
        opacity: {
          duration: drop.speed,
          ease: "easeOut",
          delay: drop.delay + drop.speed * 0.7,
          repeat: Infinity
        }
      }
    })
  };
  
  // Loading screen component
  if (isLoading) {
    return (
      <div className={`h-screen w-screen flex items-center justify-center ${isDarkMode ? 'bg-gray-900' : 'bg-blue-50'}`}>
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <motion.div 
            animate={{ 
              rotate: 360,
              scale: [1, 1.2, 1],
              transition: { duration: 3, repeat: Infinity, ease: "easeInOut" }
            }}
            className="inline-block mb-4"
          >
            <Droplets size={60} className="text-blue-500" />
          </motion.div>
          
          <motion.h2 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className={`text-3xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}
          >
            Farm Flood Risk Manager
          </motion.h2>
          
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: "100%" }}
            transition={{ duration: 1.5, ease: "easeInOut" }}
            className="h-1 bg-blue-500 rounded-full mt-4 max-w-xs mx-auto"
          />
        </motion.div>
      </div>
    );
  }
  
  // Navigation menu items
  const navItems = [
    { name: 'Home', icon: <Home size={20} />, id: 'home' },
    { name: 'Calendar Planner', icon: <Calendar size={20} />, id: 'calendar' },
    { name: 'Flood Risk Manager', icon: <Droplets size={20} />, id: 'flood' },
    { name: 'Farm Map', icon: <Map size={20} />, id: 'map' },
    { name: 'Weather Recommendations', icon: <Cloud size={20} />, id: 'weather' },
    { name: 'Settings', icon: <Settings size={20} />, id: 'settings' }
  ];
  
  // Rain background effect
  const RainBackground = () => (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {rainDrops.map((drop) => (
        <motion.div
          key={drop.id}
          custom={drop}
          variants={rainDropVariants}
          initial="hidden"
          animate="visible"
          className={`absolute w-${Math.floor(drop.size)}px h-${Math.floor(drop.size * 8)}px rounded-full bg-blue-400`}
          style={{
            left: `${drop.x}%`,
            opacity: 0.3,
            width: `${drop.size}px`,
            height: `${drop.size * 8}px`,
          }}
        />
      ))}
    </div>
  );
  
  // Side navigation menu
  const SideMenu = () => (
    <AnimatePresence>
      {isMenuOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black z-40"
            onClick={() => setIsMenuOpen(false)}
          />
          <motion.div
            initial={{ x: -300 }}
            animate={{ x: 0 }}
            exit={{ x: -300 }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className={`fixed left-0 top-0 bottom-0 w-72 z-50 ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-xl`}
          >
            <div className="p-6">
              <div className="flex justify-between items-center mb-8">
                <div className="flex items-center">
                  <Droplets size={28} className="text-blue-500 mr-2" />
                  <h2 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                    Farm Flood
                  </h2>
                </div>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setIsMenuOpen(false)}
                  className={`p-2 rounded-full ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                >
                  <X size={20} className={isDarkMode ? 'text-white' : 'text-gray-800'} />
                </motion.button>
              </div>
              
              <div className="space-y-2">
                {navItems.map((item, i) => (
                  <motion.div
                    key={item.id}
                    custom={i}
                    variants={menuItemVariants}
                    initial="hidden"
                    animate="visible"
                    whileHover="hover"
                    onClick={() => {
                      setActiveSection(item.id);
                      setIsMenuOpen(false);
                    }}
                    className={`flex items-center px-4 py-3 rounded-lg cursor-pointer ${
                      activeSection === item.id 
                        ? isDarkMode ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-700'
                        : isDarkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <div className="mr-3">{item.icon}</div>
                    <span className="font-medium">{item.name}</span>
                  </motion.div>
                ))}
              </div>
              
              <div className="absolute bottom-6 left-0 right-0 px-6">
                <motion.div 
                  className={`flex items-center justify-between p-3 rounded-lg cursor-pointer ${
                    isDarkMode ? 'bg-gray-700 text-white hover:bg-gray-600' : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                  }`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="flex items-center">
                    <LogOut size={18} className="mr-2" />
                    <span className="font-medium">Logout</span>
                  </div>
                </motion.div>
                
                <div className="mt-4 flex justify-center">
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setIsDarkMode(!isDarkMode)}
                    className={`p-3 rounded-full ${
                      isDarkMode ? 'bg-gray-700 text-yellow-400' : 'bg-gray-200 text-gray-700'
                    }`}
                  >
                    {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
                  </motion.button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
  
  // Notification panel
  const NotificationPanel = () => (
    <AnimatePresence>
      {showNotificationPanel && (
        <motion.div 
          initial={{ opacity: 0, y: -20, x: "100%" }}
          animate={{ opacity: 1, y: 0, x: 0 }}
          exit={{ opacity: 0, y: -20, x: "100%" }}
          transition={{ type: "spring", damping: 30, stiffness: 400 }}
          className={`absolute top-16 right-4 w-80 shadow-xl rounded-xl overflow-hidden z-50 ${
            isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'
          }`}
        >
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
            <h3 className="font-semibold">Notifications</h3>
            <span className="text-xs text-blue-500 cursor-pointer hover:underline">
              Mark all as read
            </span>
          </div>
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                No new notifications
              </div>
            ) : (
              notifications.map((notification) => (
                <motion.div
                  key={notification.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  whileHover={{ scale: 1.02, backgroundColor: isDarkMode ? 'rgba(55, 65, 81, 0.3)' : 'rgba(243, 244, 246, 0.7)' }}
                  onClick={() => handleNotificationClick(notification.id)}
                  className={`p-3 border-b border-gray-100 dark:border-gray-700 cursor-pointer ${
                    !notification.read ? (isDarkMode ? 'bg-gray-700' : 'bg-blue-50') : ''
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex items-start">
                      <div className={`mt-1 mr-3 p-1 rounded-full ${
                        notification.type === 'warning' 
                          ? 'bg-yellow-100 text-yellow-500' 
                          : 'bg-blue-100 text-blue-500'
                      }`}>
                        {notification.type === 'warning' ? (
                          <AlertTriangle size={14} />
                        ) : (
                          <Info size={14} />
                        )}
                      </div>
                      <div>
                        <p className={`text-sm font-medium ${!notification.read ? 
                          (isDarkMode ? 'text-white' : 'text-gray-800') : 
                          (isDarkMode ? 'text-gray-300' : 'text-gray-600')
                        }`}>
                          {notification.message}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          Just now
                        </p>
                      </div>
                    </div>
                    {!notification.read && (
                      <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                    )}
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
  
  // Alert Triangle icon
  const AlertTriangle = ({ size = 24 }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
      <line x1="12" y1="9" x2="12" y2="13"></line>
      <line x1="12" y1="17" x2="12.01" y2="17"></line>
    </svg>
  );
  
  // Info icon
  const Info = ({ size = 24 }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"></circle>
      <line x1="12" y1="16" x2="12" y2="12"></line>
      <line x1="12" y1="8" x2="12.01" y2="8"></line>
    </svg>
  );
  
  // Feature card component
  const FeatureCard = ({ icon, title, description, color, index }) => (
    <motion.div
      variants={itemVariants}
      whileHover={{ 
        y: -10, 
        boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)"
      }}
      className={`rounded-2xl overflow-hidden ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg`}
    >
      <div className={`h-2 bg-${color}-500`}></div>
      <div className="p-6">
        <div className={`w-12 h-12 rounded-xl bg-${color}-100 flex items-center justify-center mb-4`}>
          <div className={`text-${color}-500`}>{icon}</div>
        </div>
        <h3 className={`text-lg font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
          {title}
        </h3>
        <p className={`mb-4 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          {description}
        </p>
        <motion.button
          whileHover={{ x: 5 }}
          className={`flex items-center text-${color}-500 font-medium text-sm`}
          onClick={() => setActiveSection(title.toLowerCase().replace(' ', ''))}
        >
          Explore
          <ArrowRight size={16} className="ml-1" />
        </motion.button>
      </div>
    </motion.div>
  );
  
  // Weather preview component with animation
  const WeatherPreview = () => (
    <motion.div
      animate={weatherControls}
      className={`rounded-2xl p-6 ${isDarkMode ? 'bg-gray-800' : 'bg-gradient-to-br from-blue-50 to-blue-100'} shadow-lg`}
    >
      <div className="flex justify-between items-start">
        <div>
          <h3 className={`text-lg font-semibold mb-1 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
            Current Weather
          </h3>
          <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Monday, April 28
          </p>
        </div>
        <div className="flex flex-col items-end">
          <div className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
            72°F
          </div>
          <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Partly Cloudy
          </div>
        </div>
      </div>
      
      <div className="mt-6 grid grid-cols-3 gap-2">
        <WeatherStat icon={<Droplets size={16} />} label="Humidity" value="65%" />
        <WeatherStat icon={<Wind size={16} />} label="Wind" value="8 mph" />
        <WeatherStat icon={<Cloud size={16} />} label="Rain" value="10%" />
      </div>
      
      <div className="mt-6">
        <h4 className={`text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
          Forecast
        </h4>
        <div className="flex space-x-4 overflow-x-auto pb-2">
          {['Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, i) => (
            <motion.div
              key={day}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * i }}
              className="flex flex-col items-center"
            >
              <span className={`text-xs mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>{day}</span>
              {i % 2 === 0 ? (
                <Sun size={20} className="text-yellow-500 mb-1" />
              ) : (
                <Cloud size={20} className="text-blue-500 mb-1" />
              )}
              <span className={`text-xs font-medium ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                {70 + i}°F
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
  
  // Weather stat component
  const WeatherStat = ({ icon, label, value }) => (
    <div className={`rounded-lg p-2 ${isDarkMode ? 'bg-gray-700' : 'bg-white bg-opacity-60'}`}>
      <div className="flex items-center mb-1">
        <div className={`${isDarkMode ? 'text-gray-400' : 'text-gray-500'} mr-1`}>{icon}</div>
        <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>{label}</span>
      </div>
      <div className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>{value}</div>
    </div>
  );
  
  // Wind icon component
  const Wind = ({ size = 24 }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9.59 4.59A2 2 0 1 1 11 8H2m10.59 11.41A2 2 0 1 0 14 16H2m15.73-8.27A2.5 2.5 0 1 1 19.5 12H2"></path>
    </svg>
  );
  
  // Quick action button
  const QuickActionButton = ({ icon, label, onClick }) => (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={`flex flex-col items-center justify-center p-4 rounded-xl ${
        isDarkMode ? 'bg-gray-800 hover:bg-gray-700' : 'bg-white hover:bg-gray-50'
      } shadow-md`}
    >
      <div className={`mb-2 ${isDarkMode ? 'text-blue-400' : 'text-blue-500'}`}>{icon}</div>
      <span className={`text-xs font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>{label}</span>
    </motion.button>
  );
  
  // Home content
  const HomeContent = () => (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Hero section */}
      <div 
        ref={heroRef}
        className="relative overflow-hidden rounded-3xl mb-8"
      >
        <motion.div
          style={{ 
            rotateX: heroRotation.x,
            rotateY: heroRotation.y,
            transformPerspective: 1000,
          }}
          className="relative z-10"
        >
          <div className={`p-8 ${isDarkMode ? 'bg-gradient-to-br from-blue-900 to-gray-900' : 'bg-gradient-to-br from-blue-400 to-blue-600'} rounded-3xl overflow-hidden relative`}>
            {/* Animated background elements */}
            <div className="absolute inset-0 z-0 overflow-hidden">
              <motion.div
                animate={{ 
                  rotate: 360,
                  transition: { repeat: Infinity, duration: 100, ease: "linear" }
                }}
                className="absolute -bottom-40 -right-40 w-80 h-80 rounded-full bg-blue-300 opacity-20"
              />
              <motion.div
                animate={{ 
                  rotate: -360,
                  transition: { repeat: Infinity, duration: 70, ease: "linear" }
                }}
                className="absolute -top-20 -left-20 w-60 h-60 rounded-full bg-blue-300 opacity-10"
              />
              <motion.div
                animate={{ 
                  x: [0, 50, 0],
                  y: [0, 30, 0],
                  transition: { repeat: Infinity, duration: 15, ease: "easeInOut" }
                }}
                className="absolute top-1/3 left-1/3 w-12 h-12 rounded-full bg-white opacity-10"
              />
            </div>
            
            {/* Content */}
            <div className="relative z-10 max-w-lg">
              <motion.h1 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-3xl sm:text-4xl font-bold text-white mb-4"
              >
                Farm Flood Risk Management System
              </motion.h1>
              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-blue-100 mb-6"
              >
                Monitor, predict, and manage flood risks for your farm with our comprehensive dashboard and tools.
              </motion.p>
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="flex space-x-4"
              >
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-6 py-3 bg-white text-blue-600 font-medium rounded-xl shadow-lg"
                  onClick={() => setActiveSection('flood')}
                >
                  View Flood Risks
                </motion.button>
                <a href="/home">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-6 py-3 bg-blue-700 text-white font-medium rounded-xl shadow-lg"
                  onClick={() => setActiveSection('./kenya')}
                >
                  Explore Farm Map
                </motion.button>
                </a>
              </motion.div>
            </div>
            
            {/* Floating elements */}
            <motion.div
              animate={{ 
                y: [0, -15, 0],
                transition: { repeat: Infinity, duration: 3, ease: "easeInOut" }
              }}
              className="absolute right-8 top-1/2 transform -translate-y-1/2 hidden lg:block"
            >
              <div className="relative">
                <svg width="180" height="180" viewBox="0 0 200 200" className="text-white opacity-10">
                  <path fillRule="evenodd" clipRule="evenodd" d="M100 0C155.228 0 200 44.7715 200 100C200 155.228 155.228 200 100 200C44.7715 200 0 155.228 0 100C0 44.7715 44.7715 0 100 0Z" fill="currentColor" />
                </svg>
                <Droplets size={60} className="absolute inset-0 m-auto text-white opacity-90" />
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>
      
      {/* Quick actions */}
      <div className="mb-8">
        <h2 className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
          Quick Actions
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <QuickActionButton 
            icon={<Droplets size={24} />} 
            label="Check Flood Risk" 
            onClick={() => setActiveSection('flood')}
          />
           {/* <a href="/Plant"> */}
           <QuickActionButton 
            icon={<Calendar size={24} />} 
            label="Schedule Tasks" 
            onClick={() => setActiveSection('./plant')}
          
          />
           {/* </a> */}
          <QuickActionButton 
            icon={<Map size={24} />} 
            label="View Farm Map" 
            onClick={() => setActiveSection('map')}
          />
          <QuickActionButton 
            icon={<Cloud size={24} />} 
            label="Weather Forecast" 
            onClick={() => setActiveSection('weather')}
          />
        </div>
      </div>
      
      {/* Features and Weather sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2">
          <h2 className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
            Features
          </h2>
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 sm:grid-cols-2 gap-6"
          >
            <FeatureCard 
              icon={<Droplets size={24} />} 
              title="Flood Risk Analysis" 
              description="Monitor and analyze flood risks across your farmland with real-time data and predictions."
              color="blue"
              index={0}
            />
            <FeatureCard 
              icon={<Calendar size={24} />} 
              title="Task Planning" 
              description="Schedule and manage farm tasks based on weather forecasts and flood risk assessments."
              color="indigo"
              index={1}
            />
            <FeatureCard 
              icon={<Map size={24} />} 
              title="Interactive Farm Map" 
              description="Visualize your farm's layout with interactive mapping tools highlighting risk areas."
              color="green"
              index={2}
            />
            <FeatureCard 
              icon={<Cloud size={24} />} 
              title="Weather Insights" 
              description="Get detailed weather forecasts and recommendations specific to your farm location."
              color="purple"
              index={3}
            />
          </motion.div>
        </div>
        <div>
          <h2 className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
            Weather
          </h2>
          <WeatherPreview />
        </div>
      </div>
      
      {/* Risk alerts section */}
      <div className="mb-8">
        <h2 className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
          Current Risk Alerts
        </h2>
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`rounded-xl p-6 ${
            isDarkMode ? 'bg-gray-800' : 'bg-white'
          } shadow-lg border-l-4 border-yellow-500`}
        >
          <div className="flex items-start">
            <div className="p-2 rounded-full bg-yellow-100 text-yellow-500 mr-4">
              <AlertTriangle size={20} />
            </div>
            <div>
              <h3 className={`font-medium text-lg mb-1 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                Moderate Flood Risk
              </h3>
              <p className={`text-sm mb-3 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                North field area shows increased risk due to recent rainfall and upcoming weather forecast.
              </p>
              <div className="flex space-x-4">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-4 py-2 bg-yellow-100 text-yellow-700 text-sm font-medium rounded-lg"
                  onClick={() => setActiveSection('flood')}
                >
                  View Details
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg"
                >
                  Dismiss
                </motion.button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
  
  // Content renderer based on active section
  const renderContent = () => {
    switch (activeSection) {
      case 'calendar':
        return <Navigate to="/plant" replace />;
      case 'calendar':
        return (
          <div className={`p-6 rounded-xl ${isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'} shadow-lg`}>
            <h2 className="text-xl font-bold mb-4">Calendar Planner</h2>
            <p className="text-gray-500 dark:text-gray-400">Calendar component would be loaded here</p>
            {/* <CalendarPlanner /> */}
          </div>
        );
        case 'flood':
          return <Navigate to="/hero" replace />;
      case 'flood':
        return (
          <div className={`p-6 rounded-xl ${isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'} shadow-lg`}>
            <h2 className="text-xl font-bold mb-4">Farm Map</h2>
            <p className="text-gray-500 dark:text-gray-400">Farm map component would be loaded here</p>
            {/* <FarmMap /> */}
          </div>
        );
        case 'weather':
          return <Navigate to="/kenya" replace />;
      case 'settings':
        return (
          <div className={`p-6 rounded-xl ${isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'} shadow-lg`}>
            <h2 className="text-xl font-bold mb-4">Settings</h2>
            <p className="text-gray-500 dark:text-gray-400">Settings component would be loaded here</p>
            {/* <SettingsPanel /> */}
          </div>
        );
      
      case 'map':
        return <Navigate to="/home" replace />;
    case 'map':
      return (
        <div className={`p-6 rounded-xl ${isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'} shadow-lg`}>
          <h2 className="text-xl font-bold mb-4">Farm Map</h2>
          <p className="text-gray-500 dark:text-gray-400">Farm map component would be loaded here</p>
          {/* <FarmMap /> */}
        </div>
      );
      default:
        return <HomeContent />;
    }
  };
  
  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-blue-50 text-gray-900'}`}>
      {/* Rain effect background */}
      <RainBackground />
      
      {/* Top navigation bar */}
      <header className={`fixed top-0 left-0 right-0 z-30 px-4 py-3 ${isDarkMode ? 'bg-gray-900' : 'bg-white'} shadow-sm`}>
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setIsMenuOpen(true)}
              className={`p-2 rounded-full mr-4 ${isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'}`}
            >
              <Menu size={22} className={isDarkMode ? 'text-white' : 'text-gray-800'} />
            </motion.button>
            <div className="flex items-center">
              <Droplets size={24} className="text-blue-500 mr-2" />
              <h1 className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                Farm Flood
              </h1>
            </div>
          </div>
          
          <div className="flex items-center">
            <motion.div className="relative mr-4">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                animate={notificationBadgeControls}
                onClick={() => setShowNotificationPanel(!showNotificationPanel)}
                className={`p-2 rounded-full relative ${isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'}`}
              >
                <Bell size={22} className={isDarkMode ? 'text-white' : 'text-gray-800'} />
                {unreadCount > 0 && (
                  <span className="absolute top-0 right-0 transform translate-x-1/4 -translate-y-1/4 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </motion.button>
              <NotificationPanel />
            </motion.div>
            
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setIsDarkMode(!isDarkMode)}
              className={`p-2 rounded-full ${isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'}`}
            >
              {isDarkMode ? (
                <Sun size={22} className="text-yellow-400" />
              ) : (
                <Moon size={22} className="text-gray-800" />
              )}
            </motion.button>
          </div>
        </div>
      </header>
      
      {/* Side Menu */}
      <SideMenu />
      
      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 pt-20 pb-12">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeSection}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            {renderContent()}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
};

export default HomePage;