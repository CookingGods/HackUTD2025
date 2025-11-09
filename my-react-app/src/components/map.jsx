
import React, { useState } from "react";
import mapImage from "../assets/map.png";
import "./Map.css";

const Map = () => {
  const [activeButton, setActiveButton] = useState(null);

  const buttons = [
    { id: 1, top: "30%", left: "40%", size: "10%", color: "grey" },
    { id: 2, top: "50%", left: "10%", size: "12%", color: "grey" },
    { id: 3, top: "55%", left: "60%", size: "18%", color: "grey" },
    { id: 3, top: "30%", left: "80%", size: "8%", color: "grey" },
  ];

  const handleClick = (id) => {
    setActiveButton(id); // set the clicked one active
  };

  return (
    <div className="map-container">
      <img src={mapImage} alt="Map" className="map-image" loading="lazy" />

      {buttons.map((btn) => (
        <button
          key={btn.id}
          className="map-button"
          style={{
            top: btn.top,
            left: btn.left,
            width: btn.size,
            height: btn.size,
            backgroundColor: activeButton === btn.id ? "pink" : btn.color,
          }}
          onClick={() => handleClick(btn.id)}
        />
      ))}
    </div>
  );
};

export default Map;
