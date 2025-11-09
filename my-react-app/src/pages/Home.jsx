import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Home.css"; // import the CSS file

const Home = () => {
  const [hovered, setHovered] = useState(null);
  const navigate = useNavigate();

  const trendingTopics = [
    "Newest Bug",
    "Cost of Product",
    "Best Phone for T-Mobile",
    "Lowest Cost Plan",
    "2025 vs 2024 Phone",
    "School not allowing school",
    "Lowest Plan",
  ];

  // SemiCircleGauge component kept inline
  const SemiCircleGauge = ({ percentage }) => {
    const value = Math.max(0, Math.min(percentage, 100));
    const rotation = (value / 100) * 180;

    return (
      <div className="gauge-container">
        <div className="gauge-bg"></div>
        <div className="gauge-fill" style={{ transform: `rotate(${rotation}deg)` }}></div>
        <div className="gauge-label">{value.toFixed(1)}%</div>
      </div>
    );
  };

  return (
    <div className="home-body">
      <aside className="home-sidebar">
        {trendingTopics.map((topic, index) => (
          <div
            key={index}
            onMouseEnter={() => setHovered(index)}
            onMouseLeave={() => setHovered(null)}
            onClick={() => navigate(`/topics/${topic}`)}
            className={`trending-box ${hovered === index ? "hovered" : ""}`}
          >
            {topic}
          </div>
        ))}
      </aside>

      <main className="home-main">
        <h1>Dashboard Content Here</h1>
        <SemiCircleGauge percentage={90.8} />
      </main>
    </div>
  );
};

export default Home;
