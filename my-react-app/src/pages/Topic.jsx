import React from 'react';
import { useParams } from 'react-router-dom';

const Topic = () => {
  const { topicName } = useParams();

  return (
    <div>
      <h1>{topicName}</h1>
      {/* Add more content here */}
    </div>
  );
};

export default Topic;
