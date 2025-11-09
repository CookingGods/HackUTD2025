import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./Home.css";
import Map from "../components/map";

const Home = () => {
  const [hovered, setHovered] = useState(null);
  const [gaugePercent, setGaugePercent] = useState(0); // State for animation
  const navigate = useNavigate();

  // Use useEffect to trigger the gauge animation after component mounts
  useEffect(() => {
    // The target percentage is 90.8%
    const targetPercent = 90.8;
    setGaugePercent(targetPercent);
  }, []);

  // Function to calculate the stroke-dashoffset for the gauge animation
  const getGaugeOffset = (percent) => {
    const circumference = 282.74; // Calculated for r=45 (2 * pi * 45)
    // The offset is the *unfilled* part of the circle
    return circumference * (1 - (percent / 100));
  };

  const trendingTopics = [
    "coverage",
    "Billing",
    "Best Phone for T-Mobile",
    "Lowest Cost Plan",
    "2025 vs 2024 Phone",
    "School not allowing school",
    "Lowest Plan",
  ];

  return (
    <div className="home-body">
      <aside className="home-sidebar">
        {trendingTopics.map((topic, index) => (
          <button
            key={index}
            onMouseEnter={() => setHovered(index)}
            onMouseLeave={() => setHovered(null)}
            onClick={() => navigate(`/topics/${encodeURIComponent(topic)}`)}
            className={`trending-box ${hovered === index ? "hovered" : ""}`}
          >
            {/* Added index and "Trending" text */}
            <div style={{ fontWeight: 'normal', opacity: 0.7 }}>{index + 1} - Trending</div>
            <div style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>{topic}</div>
          </button>
        ))}
      </aside>

      <main className="home-main">

        {/* 1. Line Chart Placeholder */}
        <div className="dashboard-item chart-container">
          <p style={{ marginBottom: 'auto', fontWeight: 'bold' }}>Line Chart Data (2014 - 2020)</p>
          <div style={{ width: '100%', height: '80%', backgroundColor: '#f0f0f0', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            {/* Chart Visualization Placeholder */}
          </div>
        </div>

        {/* 2. Animated Percentage Gauge (Feature 1) */}
        <div className="dashboard-item gauge-container">
          <p style={{ marginBottom: '0.5rem', fontWeight: 'bold' }}>Satisfaction Rate - Jun 2023</p>
          <svg width="150" height="150" viewBox="0 0 100 100">
            {/* Background Arc - Grey */}
            <circle
              cx="50" cy="50" r="45"
              fill="none" stroke="#eee" strokeWidth="10"
              strokeDasharray="141.37px 282.74px" /* 50% of circle */
              transform="rotate(-225 50 50)" /* Start from bottom-left */
            />

            {/* Foreground Arc - Green (Animated) */}
            <circle
              cx="50" cy="50" r="45"
              className="gauge-arc"
              style={{
                stroke: '#00cc66', // Green color from image
                strokeDashoffset: getGaugeOffset(gaugePercent), // Controlled by state for animation
                transition: 'stroke-dashoffset 2s ease-out', // Smooth transition for animation
                transform: 'rotate(-225deg)', // Start from bottom-left, same as background
                transformOrigin: '50% 50%',
                strokeDasharray: '282.74px', // Full circumference
              }}
            />
            <text x="50" y="60" textAnchor="middle" fontSize="16" fontWeight="bold" fill="#222">{gaugePercent.toFixed(1)}%</text>
          </svg>
        </div>

        {/* 3. Simple US Map Placeholder (Feature 3) */}
        <div style={{padding: "5px"}} className="dashboard-item map-container">
          <Map />
        </div>
      </main>
    </div>
  );
};

export default Home;