import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import Papa from 'papaparse';
import "./Topic.css";

const Topic = () => {
  const { topicName } = useParams();
  const location = useLocation();
  const { trendingIndex, trendingTopics } = location.state || { trendingIndex: 1, trendingTopics: [] };
  const decodedTopic = decodeURIComponent(topicName);
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
        const response = await fetch('/tmobile_reviews_labeled.csv');
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
            <div className="satisfaction-gauge">
              {/*Add satisfaction gauge */}
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
              <span className="trending-label">{trendingIndex} - Trending</span>
              <h2 className="trending-title">{decodedTopic}</h2>
            </div>
          </div>

          <div className="chat-section">
            {/*chat here */}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Topic;