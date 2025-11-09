import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Papa from 'papaparse';
import "./Topic.css";

const Topic = () => {
  const { topicName } = useParams();
  const decodedTopic = decodeURIComponent(topicName);
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);

  const handleBack = () => {
    navigate(-1);
  };

  useEffect(() => {
    const loadCSV = async () => {
      try {
        const response = await fetch('/reddit_text.csv');
        const csvText = await response.text();

        Papa.parse(csvText, {
          header: true,
          complete: (results) => {
            const sortedPosts = results.data
              .filter(post => post.text && post.text.trim() !== '' && post.title) // remove empty text/title
              .sort((a, b) => new Date(b.date) - new Date(a.date));

            setPosts(sortedPosts);
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

  // Filter posts to only include those that contain the trending topic in title or text
  const filteredPosts = posts.filter(post =>
    post.title.toLowerCase().includes(decodedTopic.toLowerCase()) ||
    post.text.toLowerCase().includes(decodedTopic.toLowerCase())
  );

  return (
    <div className="topic-container">
      <div className="topic-header">
        <button className="back-button" onClick={handleBack}>Back</button>
        <div className="topic-title-container">
          <h1 className="topic-title">{decodedTopic}</h1>
        </div>
      </div>

      <div className="bubbles-container">
        {filteredPosts.length > 0 ? (
          filteredPosts.map((post, index) => (
            <div key={index} className="bubble">
              <div className="bubble-source">
                {post.url.toLowerCase().includes("reddit") && (
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
    </div>
  );
};

export default Topic;
