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

  // Initial load
  loadCSV();

  // Refresh every 5 seconds
  const interval = setInterval(loadCSV, 500);

  // Cleanup interval when component unmounts
  return () => clearInterval(interval);
}, []);




  const trendingTopics = React.useMemo(() => {
    // 1. Create an object to hold the counts
    const topicCounts = {};

    // 2. Loop over all posts and count by topic_name
    for (const post of posts) {
      const topicId = post.topic_name; // Your parser makes this lowercase
      
      if (topicId) {
        // Add to the count for this topic_name, or initialize it to 1
        topicCounts[topicId] = (topicCounts[topicId] || 0) + 1;
      }
    }

    // 3. Convert the counts object into an array
    // From: { topic_A: 10, topic_B: 5 }
    // To: [ ['topic_A', 10], ['topic_B', 5] ]
    const countsArray = Object.entries(topicCounts);

    // 4. Sort the array by count (the second item, index 1) in descending order
    countsArray.sort((a, b) => b[1] - a[1]);

    // 5. (Optional) Map to a cleaner object format
    // From: [ ['topic_A', 10], ['topic_B', 5] ]
    // To: [ {topic_name: 'topic_A', count: 10}, {topic_name: 'topic_B', count: 5} ]
    return countsArray.map(([topic_name, count]) => ({
      topic_name: topic_name,
      count: count
    }));

  }, [posts]);

  // const trendingTopics = [
  //   "Newest Bug",
  //   "Cost of Product",
  //   "Best Phone for T-Mobile",
  //   "Lowest Cost Plan",
  //   "2025 vs 2024 Phone",
  //   "School not allowing school",
  //   "Lowest Plan",
  // ];

  return (
    <div className="home-body">
      <aside className="home-sidebar">
        {trendingTopics.map((topic, index) => (
          <button
            key={index}
            onMouseEnter={() => setHovered(index)}
            onMouseLeave={() => setHovered(null)}
            // FIX 1: Use topic.topic_name for the navigation URL
            onClick={() => navigate(`/topics/${encodeURIComponent(topic.topic_name)}`)}
            className={`trending-box ${hovered === index ? "hovered" : ""}`}
          >
            <div style={{ fontWeight: 'normal', opacity: 0.7 }}>{index + 1} - Trending</div>
            
            {/* FIX 2: Render the topic_name property, not the whole object */}
            <div style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>{topic.topic_name}</div>

            {/* Optional: You could also show the count */}
            {/* <div style={{ opacity: 0.8 }}>Count: {topic.count}</div> */}
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
          <p style={{ marginBottom: '0.5rem', fontWeight: 'bold' }}>Satisfaction Rate</p>
          <svg width="150" height="150" viewBox="0 0 100 100">
            <circle
              cx="50" cy="50" r="45"
              fill="none" stroke="#eee" strokeWidth="10"
              strokeDasharray="210px" 
              transform="rotate(-225 50 50)"
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
                strokeDasharray: "282.74px"
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