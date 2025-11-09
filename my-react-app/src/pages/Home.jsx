import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Home.css";

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
            {topic}
          </button>
        ))}
      </aside>

      <main className="home-main">
        <h1>Dashboard Content Here</h1>
      </main>
    </div>
  );
};

export default Home;