import React from "react";
import mapImage from "../assets/map.png";

const Map = () => {
  // You can define each button’s position, size, and color in an array
  const buttons = [
    { id: 1, top: "30%", left: "40%", size: "w-8 h-8", color: "bg-red-500" },
    { id: 2, top: "60%", left: "20%", size: "w-12 h-12", color: "bg-blue-500" },
    { id: 3, top: "50%", left: "70%", size: "w-6 h-6", color: "bg-green-500" },
  ];

  return (
    <div className="relative inline-block">
      <img
        src={mapImage}
        alt="Map"
        loading="lazy"
        className="block w-full h-auto"
      />

      {buttons.map((btn) => (
        <button
          key={btn.id}
          className={`absolute rounded-full ${btn.color} ${btn.size} opacity-80 hover:opacity-100`}
          style={{ top: btn.top, left: btn.left }}
          onClick={() => alert(`Clicked button ${btn.id}`)}
        />
      ))}
    </div>
  );
};

export default Map;
