import React, { useState } from "react";
import mapImage from "../assets/map.png";
import "./Map.css";

const buttons = [
  // --- FIX: Changed id from 1 to 0 to be unique ---
  { 
    id: 0, 
    region: "All", 
    top: "-100%", 
    left: "-80%", 
    size: "200%", 
    opacity: 0
  },
  { id: 1, region: "Midwest", top: "30%", left: "40%", size: "10%", color: "grey"},
  { id: 2, region: "West",    top: "45%", left: "10%", size: "12%", color: "grey" },
  { id: 3, region: "South",   top: "50%", left: "60%", size: "16%", color: "grey" },
  { id: 4, region: "Northeast", top: "30%", left: "80%", size: "8%", color: "grey" },
];

const Map = ({ onRegionSelect }) => {
  const [activeButton, setActiveButton] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleClick = async (id, region) => {
    if (isLoading) return; 

    setActiveButton(id);
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`http://127.0.0.1:5001/filter?region=${region}`);

      if (!response.ok) {
        throw new Error(`Filter API failed: ${response.statusText}`);
      }

      const result = await response.json();
      console.log(result.message); 

      if (onRegionSelect) {
        onRegionSelect(region);
      }
    } catch (err) {
      console.error("Failed to filter data:", err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="map-container">
      <img src={mapImage} alt="Map" className="map-image" loading="lazy" />

      {buttons.map((btn) => (
        <button
          key={btn.id}
          
          /* --- 1. ADD CONDITIONAL CLASS --- */
          className={`map-button ${btn.id !== 0 ? 'hover-effect' : ''}`}
          
          style={{
            top: btn.top,
            left: btn.left,
            width: btn.size,
            
            opacity: btn.opacity !== undefined ? btn.opacity : 0.8, 
            
            zIndex: btn.zIndex !== undefined ? btn.zIndex : 0,
            backgroundColor: activeButton === btn.id ? "magenta" : (btn.color || 'transparent'),
            cursor: isLoading ? "wait" : "pointer",
          }}
          onClick={() => handleClick(btn.id, btn.region)}
          disabled={isLoading}
        />
      ))}
    </div>
  );
};

export default Map;