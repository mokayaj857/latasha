// import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Hero from "./components/Hero";
import Home from "./components/Home";
import Chatbot from "./components/Chatbot";
import Kenya from "./components/Kenya";
import Weather from "./components/Weather";
import Plant from "./components/Plant";
import Login from "./components/Login";

const App = () => {
  return (
    <Router>
      <Routes>
        
        
        {/* Qrcode under Testimonials */}
        <Route path="/" element={<Hero />} /> 
        <Route path="home" element={<Home />} />
        <Route path="kenya" element={<Kenya />} />
        <Route path="weather" element={<Weather />} />
        <Route path="plant" element={<Plant />} />
        <Route path="login" element={<Login />} />
        
        
        {/* <Route path="weather" element={<Weather />} /> */}
        {/* <Route path="kenya" element={<Kenya />} /> */}
        {/* <Route path="home" element={<Home />} /> */}
      
        <Route path="chatbot" element={<Chatbot />} />
        {/* <Route path="chatbot" element={<Chatbot />} /> */}
        
        
      </Routes>
      

        
    </Router>
  );
};

export default App;