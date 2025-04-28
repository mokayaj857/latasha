import React from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import Home from './components/Home';
import Hero from './components/Hero';
import Chatbot from './components/Chatbot';
import Kenya from './components/Kenya';
import Weather from './components/Weather';
import Plant from './components/Plant';
import Login from './components/Login';

import './index.css';


const router = createBrowserRouter([


  {
    path: "hero",
    element: <Hero />,
  },
  {
    path: "Kenya",
    element: <Kenya />,
  },
  {
    path: "Login",
    element: <Login />,
    
  },
  
  {
    path: "Plant",
    element: <Plant />,
  },
  {
    path: "Weather",
    element: <Weather/>,
  },
  {
    path: "chatbot",
    element: <Chatbot/>,
  },
  {
    path: "home",
    element: <Home />,
  },
  


]);

const rootElement = document.getElementById("root");
if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <RouterProvider router={router} />
    </React.StrictMode>
  );
} else {
  console.error("Root element not found");
}