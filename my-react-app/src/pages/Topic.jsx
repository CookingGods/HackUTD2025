import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Papa from 'papaparse';
import "./Topic.css";

const Topic = () => {
  const { topicName } = useParams();
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
        const response = await fetch('/reddit_tmobile_clean.csv');
        const csvText = await response.text();

        Papa.parse(csvText, {
          header: true,
          complete: (results) => {
            const sortedPosts = results.data
              .filter(post => (post.text && post.text.trim() !== '') || (post.title && post.title.trim() !== '')) // remove empty text/title
              .sort((a, b) => {
                // Handle date sorting - try to parse dates, fallback to 0 if invalid
                const dateA = a.date ? new Date(a.date) : new Date(0);
                const dateB = b.date ? new Date(b.date) : new Date(0);
                return isNaN(dateB.getTime()) ? 0 : (dateB.getTime() - dateA.getTime());
              });

            setPosts(sortedPosts);
            setLoading(false);
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

  const handleBack = () => {
    navigate('/');
  };

  // Filter posts to only include those that contain the trending topic in title or text
  const filteredPosts = posts.filter(post =>
    post.title?.toLowerCase().includes(decodedTopic.toLowerCase()) ||
    post.text?.toLowerCase().includes(decodedTopic.toLowerCase())
  );

  // Determine source from CSV data (default to reddit if source field doesn't exist)
  const getSource = (post) => {
    if (post.source) {
      return post.source.toLowerCase();
    }
    // Default to reddit since file is reddit_text.csv
    return 'reddit';
  };

  // Get display text (prefer text field, fallback to title)
  const getDisplayText = (post) => {
    return post.text || post.title || '';
  };

  const filters = ['Sentiment', 'Source', 'Likes', 'Newest'];

  // Get trending topic number (mock - in real app, this would come from data)
  const trendingNumber = 2;

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
            {filters.map((filter) => (
              <button
                key={filter}
                className={`filter-btn ${activeFilter === filter ? 'active' : ''}`}
                onClick={() => setActiveFilter(filter)}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>

        {/* Dashboard Content */}
        <div className="dashboard-content">
          {/* Top Row with Satisfaction Gauge and Trending Section */}
          <div className="dashboard-top-row">
            {/* Satisfaction Gauge */}
            <div className="satisfaction-gauge">
              <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem', fontWeight: 'bold' }}>Satisfaction Rate - Jun 2023</h3>
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flex: 1 }}>
                <svg width="200" height="120" viewBox="0 0 200 120">
                  <path
                    d="M 30 100 A 70 70 0 0 1 170 100"
                    fill="none"
                    stroke="#e0e0e0"
                    strokeWidth="12"
                    strokeLinecap="round"
                  />
                  <path
                    d="M 30 100 A 70 70 0 0 1 170 100"
                    fill="none"
                    stroke="#00cc66"
                    strokeWidth="12"
                    strokeLinecap="round"
                    strokeDasharray="220"
                    strokeDashoffset={220 - (gaugePercent / 100) * 220}
                    style={{
                      transition: 'stroke-dashoffset 2s ease-out',
                    }}
                  />
                  <text x="100" y="85" textAnchor="middle" fontSize="32" fontWeight="bold" fill="#222">
                    {gaugePercent.toFixed(1)}%
                  </text>
                </svg>
              </div>
            </div>

            {/* Trending Section */}
            <div className="trending-section">
              <span className="trending-label">{trendingNumber} - Trending</span>
              <h2 className="trending-title">{decodedTopic}</h2>
            </div>
          </div>

          {/* Chat Section */}
          <div className="chat-section">
            <div style={{ textAlign: 'center', width: '100%' }}>
              <div style={{ marginBottom: '1rem', fontSize: '1rem', color: '#333' }}>
                Hey — can you clarify what you mean by "stuff"? Want me to list or help with something specific?
              </div>
              <div style={{
                display: 'inline-block',
                backgroundColor: '#f0f0f0',
                padding: '0.5rem 1rem',
                borderRadius: '15px',
                marginBottom: '2rem',
                fontSize: '0.9rem',
                color: '#333'
              }}>
                why jake is so fucking dumb
              </div>
              <div style={{
                display: 'flex',
                gap: '0.5rem',
                maxWidth: '500px',
                margin: '0 auto',
                alignItems: 'center'
              }}>
                <input
                  type="text"
                  placeholder="Ask anything"
                  style={{
                    flex: 1,
                    padding: '0.75rem 1rem',
                    border: '1px solid #ddd',
                    borderRadius: '25px',
                    fontSize: '1rem',
                    outline: 'none'
                  }}
                />
                <button style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  backgroundColor: '#e20074',
                  border: 'none',
                  color: 'white',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <path d="M10 15L10 5M10 5L5 10M10 5L15 10" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Topic;
