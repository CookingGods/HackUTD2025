import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import "./Topic.css"; // FIXED: Changed import from "./Home.css" to "./Topic.css"

const Topic = () => {
  const { topicName } = useParams();
  const decodedTopic = decodeURIComponent(topicName);
  const navigate = useNavigate();

  const handleBack = () => {
    navigate(-1);
  };

  return (
    <div className="topic-container">
      <button className="back-button" onClick={handleBack}>Back</button>
      <h1>{decodedTopic}</h1>
      {/* Add more content here */}
    </div>
  );
};

export default Topic;