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
            //Sort posts by date
            const sortedPosts = results.data
              //Remove empty posts
              .filter(post => post.text && post.text.trim() !== '') 
              //Sort newest to oldest
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

  return (
    <div className="topic-container">
      <div className="topic-header">
        <button className="back-button" onClick={handleBack}>Back</button>
        <h1>{decodedTopic}</h1>
      </div>
      <div className="bubbles-container">
        {posts.map((post, index) => (
          <div key={index} className="bubble">
            <div className="bubble-source">
                <img src="/src/Logos/reddit_logo.png" alt="Logo" />
            </div>
            <p className="bubble-text">{post.text}</p>
            <span className="bubble-date">{new Date(post.date).toLocaleDateString()}</span>
          </div>
        ))}
      </div>
      <div className="main-content">
        {/* Additional content can go here */}
      </div>
    </div>
  );
};

export default Topic;
