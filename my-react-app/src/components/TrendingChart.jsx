import React, { useState, useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const TrendingChart = ({ posts }) => {
  // Memoize top topics calculation
  const topTopics = useMemo(() => {
    if (!posts || !Array.isArray(posts)) return [];

    const counts = {};
    posts.forEach((post) => {
        if (post.topic_name) {
        counts[post.topic_name] = (counts[post.topic_name] || 0) + 1;
        }
    });

    return Object.entries(counts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([name]) => name);
    }, [posts]);


  const [activeLines, setActiveLines] = useState(() =>
    topTopics.reduce((acc, topic) => {
      acc[topic] = true;
      return acc;
    }, {})
  );

  // Update activeLines when topTopics change
  React.useEffect(() => {
    setActiveLines(
      topTopics.reduce((acc, topic) => {
        acc[topic] = true;
        return acc;
      }, {})
    );
  }, [topTopics]);

  // Optimized chart data with all topics starting from 0
  const chartData = useMemo(() => {
    if (!posts || posts.length === 0) return [];

    const grouped = {};
    const allMonths = new Set();

    // First pass: collect all months and group data
    posts.forEach((post) => {
      if (!post.date || !post.topic_name) return;

      const date = new Date(post.date);
      if (isNaN(date)) return;

      const monthKey = `${date.getFullYear()}-${String(
        date.getMonth() + 1
      ).padStart(2, "0")}`;
      const topic = post.topic_name;

      allMonths.add(monthKey);

      if (!grouped[monthKey]) grouped[monthKey] = {};
      grouped[monthKey][topic] = (grouped[monthKey][topic] || 0) + 1;
    });

    // Sort all months
    const sortedMonths = Array.from(allMonths).sort();

    // Second pass: create complete dataset with 0 values for missing data
    return sortedMonths.map((monthKey) => {
      const monthData = { date: monthKey };

      // Initialize all top topics with 0
      topTopics.forEach((topic) => {
        monthData[topic] = grouped[monthKey]?.[topic] || 0;
      });

      return monthData;
    });
  }, [posts, topTopics]);

  const colors = [
    "#e91e63",
    "#9c27b0",
    "#3f51b5",
    "#2196f3",
    "#00bcd4",
    "#009688",
    "#4caf50",
    "#ff9800",
    "#ff5722",
    "#795548",
  ];

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      // Filter out zero values for cleaner tooltip
      const nonZeroPayload = payload.filter((item) => item.value > 0);

      if (nonZeroPayload.length === 0) return null;

      return (
        <div
          style={{
            backgroundColor: "white",
            padding: "12px",
            border: "2px solid #d1d5db",
            borderRadius: "8px",
            boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
            maxHeight: "300px",
            overflowY: "auto",
          }}
        >
          <p style={{ fontWeight: "bold", marginBottom: "8px" }}>{label}</p>
          {nonZeroPayload
            .sort((a, b) => b.value - a.value)
            .map((entry, index) => (
              <p
                key={index}
                style={{
                  color: entry.color,
                  fontSize: "12px",
                  margin: "2px 0",
                }}
              >
                {entry.name}: {entry.value}
              </p>
            ))}
        </div>
      );
    }
    return null;
  };

  if (!posts || posts.length === 0 || chartData.length === 0) {
    return (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#999",
        }}
      >
        No data available
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart
        data={chartData}
        margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
        <XAxis
          dataKey="date"
          stroke="#666"
          style={{ fontSize: "10px" }}
          angle={-45}
          textAnchor="end"
          height={60}
        />
        <YAxis
          stroke="#666"
          style={{ fontSize: "12px" }}
          label={{
            value: "Post Count",
            angle: -90,
            position: "insideLeft",
            style: { fontSize: "12px" },
          }}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend
          wrapperStyle={{ fontSize: "10px" }}
          onClick={(e) => {
            const topic = e.value;
            setActiveLines((prev) => ({
              ...prev,
              [topic]: !prev[topic],
            }));
          }}
        />
        {topTopics.map(
          (topic, index) =>
            activeLines[topic] && (
              <Line
                key={topic}
                type="monotone"
                dataKey={topic}
                stroke={colors[index % colors.length]}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
                animationDuration={300}
                isAnimationActive={true}
              />
            )
        )}
      </LineChart>
    </ResponsiveContainer>
  );
};

export default TrendingChart;