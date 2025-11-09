import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Papa from 'papaparse';
import "./Home.css";
import Map from "../components/map";

const Home = () => {
  const [hovered, setHovered] = useState(null);
  const [gaugePercent, setGaugePercent] = useState(0);
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);

  const getGaugeOffset = (percent) => { 
    const circumference = 282.74; 
    return circumference * (1 - (percent / 100)); 
  };

  useEffect(() => {
  const loadCSV = async () => {
    try {
      const response = await fetch('filtered_data.csv', { cache: 'no-store' });
      if (!response.ok) {
        console.error('CSV error:', response.status, response.statusText);
        return;
      }
      const csvText = await response.text();

      Papa.parse(csvText, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (h) => h.trim().toLowerCase(),
        complete: (results) => {
          const cleanedPosts = results.data
            .filter(post => post && post.text && post.text.trim() !== '' && post.topic_name)
            .sort((a, b) => new Date(b.date) - new Date(a.date));

          setPosts(cleanedPosts);

          const total = cleanedPosts.length;
          const positiveCount = cleanedPosts.filter(p => p.sentiment?.toLowerCase() === 'positive').length;
          const percentPositive = total > 0 ? (positiveCount / total) * 100 : 0;

          setGaugePercent(percentPositive);
        },
        error: (error) => {
          console.error('Error parsing CSV:', error);
        }
      });
    } catch (error) {
      console.error('Error loading CSV:', error);
    }
  };

  loadCSV();

  const interval = setInterval(loadCSV, 500);

  return () => clearInterval(interval);
}, []);




  const trendingTopics = React.useMemo(() => {
    const topicCounts = {};

    for (const post of posts) {
      const topicId = post.topic_name; 
      
      if (topicId) {
        topicCounts[topicId] = (topicCounts[topicId] || 0) + 1;
      }
    }

    const countsArray = Object.entries(topicCounts);

    countsArray.sort((a, b) => b[1] - a[1]);

    return countsArray.map(([topic_name, count]) => ({
      topic_name: topic_name,
      count: count
    }));

  }, [posts]);

  return (
    <div className="home-body">
      <aside className="home-sidebar">
        {trendingTopics.map((topic, index) => (
          <button
            key={index}
            onMouseEnter={() => setHovered(index)}
            onMouseLeave={() => setHovered(null)}

            onClick={() => navigate(`/topics/${encodeURIComponent(topic.topic_name)}`)}
            className={`trending-box ${hovered === index ? "hovered" : ""}`}
          >
            <div style={{ fontWeight: 'normal', opacity: 0.7 }}>{index + 1} - Trending</div>
            <div style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>{topic.topic_name}</div>
          </button>
        ))}
      </aside>

      <main className="home-main">

        <div className="dashboard-item chart-container">
          <p style={{ marginBottom: 'auto', fontWeight: 'bold' }}>Line Chart Data (2014 - 2020)</p>
          <div style={{ width: '100%', height: '80%', backgroundColor: '#f0f0f0', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          </div>
        </div>

        <div className="dashboard-item gauge-container">
          <p style={{ marginBottom: '0.5rem', fontWeight: 'bold' }}>Satisfaction Rate</p>
          <svg width="150" height="150" viewBox="0 0 100 100">

            <circle
              cx="50" cy="50" r="45"
              className="gauge-arc"
              style={{
                stroke: '#00cc66', 
                strokeDashoffset: getGaugeOffset(gaugePercent), 
                transition: 'stroke-dashoffset 2s ease-out', 
                transform: 'rotate(-225deg)', 
                transformOrigin: '50% 50%',
                strokeDasharray: "282.74px"
              }}
            />
            <text x="50" y="60" textAnchor="middle" fontSize="16" fontWeight="bold" fill="#222">{gaugePercent.toFixed(1)}%</text>
          </svg>
        </div>

        <div style={{padding: "5px"}} className="dashboard-item map-container">
          <Map />
        </div>
      </main>
    </div>
  );
};

export default Home;
