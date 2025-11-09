
import React, { useState } from "react";
import mapImage from "../assets/map.png";
import "./Map.css";

const buttons = [
  { id: 1, region: "Midwest", top: "30%", left: "40%", size: "10%", color: "grey" },
  { id: 2, region: "West",    top: "45%", left: "10%", size: "12%", color: "grey" },
  { id: 3, region: "South",   top: "50%", left: "60%", size: "16%", color: "grey" },
  { id: 4, region: "Northeast", top: "30%", left: "80%", size: "8%", color: "grey" },
];

const Map = ({ onRegionSelect }) => {
  const [activeButton, setActiveButton] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // 3. --- Update handleClick to call the Flask API ---
  const handleClick = async (id, region) => {
    if (isLoading) return; // Don't allow clicks while one is processing

    setActiveButton(id);
    setIsLoading(true);
    setError(null);

    try {
      // Call your Flask '/filter' endpoint
      const response = await fetch(`http://127.0.0.1:5001/filter?region=${region}`);

      if (!response.ok) {
        throw new Error(`Filter API failed: ${response.statusText}`);
      }

      const result = await response.json();
      console.log(result.message); // Logs the "success" message from Flask

      // 4. --- If successful, tell the parent component ---
      // This will trigger the parent to fetch data for the graphs
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
      
      {/* You could optionally display loading or error messages here */}
      {/* {isLoading && <div className="map-overlay">Loading...</div>} */}
      {/* {error && <div className="map-overlay-error">{error}</div>} */}

      {buttons.map((btn) => (
        <button
          key={btn.id}
          className="map-button"
          style={{
            top: btn.top,
            left: btn.left,
            width: btn.size,
            backgroundColor: activeButton === btn.id ? "magenta" : btn.color,
            cursor: isLoading ? "wait" : "pointer", // Give user feedback
          }}
          // 5. --- Pass both the id and region to the handler ---
          onClick={() => handleClick(btn.id, btn.region)}
          disabled={isLoading} // Disable buttons while filtering
        />
      ))}
    </div>
  );
};

export default Map;