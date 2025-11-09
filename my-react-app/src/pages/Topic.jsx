import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import Papa from 'papaparse';
import "./Topic.css";
import Chatbot from '../components/chatbot';

const getGaugeOffset = (percent) => {
  const circumference = 282.74; 
  return circumference * (1 - (percent / 100));
};

const Topic = () => {
  const { topicName } = useParams();
  const location = useLocation();
  const { trendingIndex, trendingTopics } = location.state || { trendingIndex: 1, trendingTopics: [] };
  const decodedTopic = decodeURIComponent(topicName);
  const [gaugePercent, setGaugePercent] = useState(0);
  const navigate = useNavigate();

  const [posts, setPosts] = useState([]);
  const [sortKey, setSortKey] = useState("newest"); 
  const [sentimentFilter, setSentimentFilter] = useState({
    positive: true,
    negative: true
  });

  const handleBack = () => {
    navigate(-1);
  };

  const handleSentimentChange = (type) => {
    setSentimentFilter(prev => ({
      ...prev,
      [type]: !prev[type]
    }));
  };

  useEffect(() => {
    const loadCSV = async () => {
      try {
        const response = await fetch('../filtered_data.csv', { cache: 'no-store' });
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
            const percentPositive = total > 0 ? (positiveCount / total) * 500 : 0;
  
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


  //Filter and sort posts
  const filteredPosts = posts
    .filter(post => post.topic_name.toLowerCase() === decodedTopic.toLowerCase())
    .filter(post => sentimentFilter[post.sentiment?.toLowerCase()] ?? true)
    .sort((a, b) => {
      if (sortKey === "likes") {
        return Number(b.thanks || 0) - Number(a.thanks || 0);
      }
      if (sortKey === "newest") {
        return new Date(b.date) - new Date(a.date);
      }
      return 0;
    });

  return (
    <div className="topic-container">
      <div className="bubbles-container">
        {filteredPosts.length > 0 ? (
          filteredPosts.map((post, index) => (
            <div key={index} className="bubble">
              <div className="bubble-source">
                {post.url?.toLowerCase().includes("reddit") && (
                  <img src="/src/Logos/reddit_logo.png" alt="Reddit Logo" />
                )}
              </div>
              <p className="bubble-text">{post.text}</p>
              <span className="bubble-date">
                {new Date(post.date).toLocaleDateString()}
              </span>
            </div>
          ))
        ) : (
          <p>No posts found for this topic.</p>
        )}
      </div>

      <div className="dashboard-container">
        <div className="dashboard-header">
          <button className="back-button" onClick={handleBack}>←</button>
          <div className="filter-buttons">
            <button
              className={`filter-btn ${sortKey === "likes" ? "active" : ""}`}
              onClick={() => setSortKey("likes")}
            >
              Likes
            </button>
            <button
              className={`filter-btn ${sortKey === "newest" ? "active" : ""}`}
              onClick={() => setSortKey("newest")}
            >
              Newest
            </button>
            <div className="sentiment-filters">
              <label>
                <input
                  type="checkbox"
                  checked={sentimentFilter.positive}
                  onChange={() => handleSentimentChange("positive")}
                />
                  Positive Sentiment
              </label>
            <label>
          <input
            type="checkbox"
            checked={sentimentFilter.negative}
            onChange={() => handleSentimentChange("negative")}
          />
          Negative Sentiment
        </label>
        </div>

          </div>
        </div>

        <div className="dashboard-content">
          <div className="dashboard-top-row">
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

            <div
              className="trending-section"
              onClick={() => {
                const nextIndex = (trendingIndex % trendingTopics.length) + 1;
                const nextTopic = trendingTopics[nextIndex - 1];
                if (nextTopic) {
                  navigate(`/topics/${encodeURIComponent(nextTopic)}`, {
                    state: {
                      trendingIndex: nextIndex,
                      trendingTopics
                    }
                  });
                }
              }}
            >
              <h2 className="trending-title">Trending Category:</h2>
              <h2 className="trending-title">{decodedTopic}</h2>
            </div>
          </div>
          
          <div style={{
            height: "100%",
            width: "100%",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column"
          }}>
            <Chatbot />
          </div>

          

        </div>
      </div>
    </div>
  );
};

export default Topic;
