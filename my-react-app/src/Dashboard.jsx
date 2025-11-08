import React, { useState } from "react";

// Styles (inline for simplicity — you can move to a CSS file later)
const styles = {
    body: {
        display: "flex",
        height: "100vh",
        backgroundColor: "#f8fdfb",
        color: "#222",
        fontFamily: "Poppins, sans-serif",
    },
    sidebar: {
        width: "22%",
        backgroundColor: "#111",
        color: "white",
        padding: "2rem 1.5rem",
        display: "flex",
        flexDirection: "column",
        overflowY: "auto",
    },
    trendingBox: {
        border: "1px solid #444",
        backgroundColor: "#1a1a1a",
        borderRadius: "10px",
        padding: "12px 16px",
        marginBottom: "1.2rem",
        transition: "all 0.3s ease",
    },
    trendingBoxHover: {
        backgroundColor: "#e20074",
        borderColor: "#e20074",
        color: "white",
        transform: "scale(1.03)",
        cursor: "pointer",
        boxShadow: "0 0 10px rgba(226, 0, 116, 0.5)",
    },
    dashboard: {
        width: "78%",
        backgroundColor: "#f7fdfa",
        display: "flex",
        flexDirection: "column",
        padding: "1.5rem",
        overflowY: "auto",
    },
    topSection: {
        display: "flex",
        gap: "1.5rem",
        marginBottom: "1.5rem",
    },
    card: {
        backgroundColor: "white",
        borderRadius: "12px",
        boxShadow: "0 2px 6px rgba(0, 0, 0, 0.1)",
        padding: "1rem",
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
    },
    mapSection: {
        backgroundColor: "white",
        borderRadius: "12px",
        boxShadow: "0 2px 6px rgba(0, 0, 0, 0.1)",
        padding: "1rem",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
    },
    map: {
        width: "90%",
        height: "400px",
        backgroundColor: "#ffcce1",
        borderRadius: "8px",
        position: "relative",
    },
    dot: {
        position: "absolute",
        width: "25px",
        height: "25px",
        backgroundColor: "#32cd32",
        borderRadius: "50%",
        opacity: 0.9,
    },
};

// --- Semi-circle Gauge Component ---
const SemiCircleGauge = ({ percentage }) => {
    // clamp percentage between 0–100
    const value = Math.max(0, Math.min(percentage, 100));
    const rotation = (value / 100) * 180; // degrees

    return (
        <div
            style={{
                position: "relative",
                width: "200px",
                height: "100px",
                overflow: "hidden",
            }}
        >
            {/* Background semicircle */}
            <div
                style={{
                    position: "absolute",
                    width: "200px",
                    height: "200px",
                    borderRadius: "50%",
                    backgroundColor: "#ddd",
                    clipPath: "inset(0 0 50% 0)",
                    transform: "rotate(0deg)",
                }}
            ></div>

            {/* Fill semicircle */}
            <div
                style={{
                    position: "absolute",
                    width: "200px",
                    height: "200px",
                    borderRadius: "50%",
                    background: "#008000",
                    clipPath: "inset(0 0 50% 0)",
                    transform: `rotate(${rotation}deg)`,
                    transformOrigin: "center bottom",
                    transition: "transform 0.6s ease",
                }}
            ></div>

            {/* Percentage label */}
            <div
                style={{
                    position: "absolute",
                    bottom: "-20px",
                    left: "50%",
                    transform: "translateX(-50%)",
                    fontSize: "1.5rem",
                    fontWeight: "600",
                    color: "#008000",
                }}
            >
                {value.toFixed(1)}%
            </div>
        </div>
    );
};

// --- Main Dashboard Component ---
const Dashboard = () => {
    const [hovered, setHovered] = useState(null);
    const [satisfaction, setSatisfaction] = useState(90.8);

    const trendingTopics = [
        "Newest Bug",
        "Cost of Product",
        "Best Phone for T-Mobile",
        "Lowest Cost Plan",
        "2025 vs 2024 Phone",
        "School not allowing school",
        "Lowest Plan",
    ];

    return (
        <div style={styles.body}>
            {/* Sidebar */}
            <aside style={styles.sidebar}>
                {trendingTopics.map((topic, index) => (
                    <div
                        key={index}
                        style={{
                            ...styles.trendingBox,
                            ...(hovered === index ? styles.trendingBoxHover : {}),
                        }}
                        onMouseEnter={() => setHovered(index)}
                        onMouseLeave={() => setHovered(null)}
                    >
                        <h2 style={{ fontSize: "1rem", color: hovered === index ? "#fff" : "#b8b8b8" }}>
                            {index + 1} - Trending
                        </h2>
                        <p style={{ fontSize: "1.2rem", fontWeight: 600 }}>{topic}</p>
                    </div>
                ))}
            </aside>

            {/* Dashboard */}
            <main style={styles.dashboard}>
                <div style={styles.topSection}>
                    <div style={styles.card}>
                        <img src="https://via.placeholder.com/300x180" alt="Trend Graph" />
                    </div>

                    <div style={styles.card}>
                        <h3 style={{ marginBottom: "10px", color: "#008000" }}>
                            Satisfaction Rate - Jun 2023
                        </h3>
                        <SemiCircleGauge percentage={satisfaction} />
                    </div>
                </div>

                <div style={styles.mapSection}>
                    <h3 style={{ marginBottom: "10px", color: "#333" }}>United States of America</h3>
                    <div style={styles.map}>
                        <div style={{ ...styles.dot, top: "60%", left: "15%" }}></div>
                        <div style={{ ...styles.dot, top: "45%", left: "40%" }}></div>
                        <div
                            style={{
                                ...styles.dot,
                                top: "50%",
                                left: "50%",
                                transform: "translate(-50%, -50%)",
                                backgroundColor: "#333",
                            }}
                        ></div>
                        <div style={{ ...styles.dot, top: "70%", left: "45%" }}></div>
                        <div style={{ ...styles.dot, top: "70%", left: "80%" }}></div>
                        <div style={{ ...styles.dot, top: "30%", left: "85%" }}></div>
                        <div style={{ ...styles.dot, top: "85%", left: "20%" }}></div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Dashboard;
