import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Papa from 'papaparse';
import "./Topic.css";

const Topic = () => {
  const { topicName } = useParams();
  const location = useLocation();
  const { trendingIndex, trendingTopics, region } = location.state || { trendingIndex: 1, trendingTopics: [] };
  const decodedTopic = decodeURIComponent(topicName);
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState('Sentiment');
  const [gaugePercent, setGaugePercent] = useState(0);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setGaugePercent(90.8);
  }, []);

  useEffect(() => {
    const loadCSV = async () => {
      try {
        const response = await fetch('/filtered_data.csv');
        if (!response.ok) {
          console.error('Filtered CSV not found:', response.status, response.statusText);
          return;
        }
        const csvText = await response.text();

        Papa.parse(csvText, {
          header: true,
          complete: (results) => {
            const cleanedPosts = results.data
              .filter(post => post && post.text && post.text.trim() !== '')
              .sort((a, b) => new Date(b.date) - new Date(a.date));

            setPosts(cleanedPosts);
          },
          error: (error) => {
            console.error('Error parsing CSV:', error);
            setLoading(false);
          }
        });
      } catch (error) {
        console.error('Error loading CSV:', error);
        setLoading(false);
      }
    };

    loadCSV();
  }, []);

  // Filter and sort posts
  const filteredPosts = posts
    .filter(post => post.topic_name.toLowerCase() === decodedTopic.toLowerCase())
    .filter(post => region ? post.region && post.region.toLowerCase() === region.toLowerCase() : true) // Filter by region if provided
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
      {/* Left Bubbles Container */}
      <div className="bubbles-container">
        {loading ? (
          <div>Loading posts...</div>
        ) : filteredPosts.length === 0 ? (
          <div>No posts found for "{decodedTopic}"</div>
        ) : (
          filteredPosts.map((post, index) => {
            const source = getSource(post);
            const displayText = getDisplayText(post);
            const postTitle = post.title || decodedTopic;
            const postDate = post.date || '';

            return (
              <div key={index} className="bubble">
                <div className="bubble-source">
                  {source === 'reddit' || source === 'reddit_text' ? (
                    <svg width="30" height="30" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" fill="#FF4500" />
                      <circle cx="9" cy="10" r="1.5" fill="#fff" />
                      <circle cx="15" cy="10" r="1.5" fill="#fff" />
                      <path d="M12 14c-2 0-3.5 1-3.5 2.5 0 1.5 1.5 2.5 3.5 2.5s3.5-1 3.5-2.5c0-1.5-1.5-2.5-3.5-2.5z" fill="#fff" />
                    </svg>
                  ) : (
                    <svg width="30" height="30" viewBox="0 0 24 24" fill="none">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" fill="#000000" />
                    </svg>
                  )}
                </div>
                <div className="bubble-title">{postTitle}</div>
                <div className="bubble-text">{displayText}</div>
                {postDate && <div className="bubble-date">{postDate}</div>}
              </div>
            );
          })
        )}
      </div>

      {/* Right Dashboard Container */}
      <div className="dashboard-container">
        {/* Dashboard Header with Back Button and Filters */}
        <div className="dashboard-header">
          <button className="back-button" onClick={handleBack}>
            ←
          </button>
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

        {/* Dashboard Content */}
        <div className="dashboard-content">
          {/* Top Row with Satisfaction Gauge and Trending Section */}
          <div className="dashboard-top-row">
            {/* Satisfaction Gauge */}
            <div className="satisfaction-gauge">
              {/* Add satisfaction gauge */}
            </div>

            {/* Trending Section */}
            <div className="trending-section">
              <span className="trending-label">{trendingNumber} - Trending</span>
              <h2 className="trending-title">{decodedTopic}</h2>
            </div>
          </div>

          {/* Chat Section */}
          <div className="chat-section">
            {/* Chat section here */}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Topic;
