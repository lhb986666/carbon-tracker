import { useEffect, useRef } from "react";
import Chart from "chart.js/auto";

export default function CarbonChart({ data, type }) {
  const canvasRef = useRef(null);
  const chartRef = useRef(null);

  const COLORS = ["#E24B4A", "#EF9F27", "#378ADD", "#1D9E75", "#7F77DD", "#D85A30", "#639922", "#D4537E"];

  useEffect(() => {
    if (!canvasRef.current || !data?.length) return;

    if (chartRef.current) chartRef.current.destroy();

    const labels = type === "bar" ? data.map((d) => d.category) : data.map((d) => d.label);
    const values = type === "bar" ? data.map((d) => d.carbon_kg) : data.map((d) => d.carbon_kg);

    chartRef.current = new Chart(canvasRef.current, {
      type,
      data: {
        labels,
        datasets: [
          {
            label: "탄소 배출량 (kg CO₂)",
            data: values,
            backgroundColor: type === "bar" ? COLORS.slice(0, data.length) : "rgba(29,158,117,0.15)",
            borderColor: type === "line" ? "#1D9E75" : undefined,
            borderWidth: type === "line" ? 2 : 0,
            borderRadius: type === "bar" ? 6 : 0,
            tension: 0.4,
            fill: type === "line",
            pointBackgroundColor: "#1D9E75",
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (ctx) => ` ${ctx.parsed.y.toFixed(2)} kg CO₂`,
            },
          },
        },
        scales: {
          x: { grid: { display: false }, ticks: { font: { size: 11 } } },
          y: {
            grid: { color: "#f0f0f0" },
            ticks: { font: { size: 11 }, callback: (v) => `${v} kg` },
          },
        },
      },
    });

    return () => chartRef.current?.destroy();
  }, [data, type]);

  if (!data?.length) return <p style={{ color: "#bbb", fontSize: 13 }}>데이터 없음</p>;

  return (
    <div style={{ position: "relative", height: 180 }}>
      <canvas ref={canvasRef} />
    </div>
  );
}