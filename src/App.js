import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";

function App() {
  const [data, setData] = useState(null);
  const [status, setStatus] = useState("syncing");

  const fetchLatest = async () => {
    const { data: result, error } = await supabase
      .from("sensor_data")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(1);

    if (error) {
      setStatus("error");
      return;
    }

    if (result?.length > 0) {
      setData(result[0]);
      setStatus("live");
    } else {
      setStatus("no-data");
    }
  };

  useEffect(() => {
    fetchLatest();

    // ⚡ REALTIME (NO POLLING NEEDED AFTER FIRST LOAD)
    const channel = supabase
      .channel("farm-realtime")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "sensor_data",
        },
        (payload) => {
          setData(payload.new);
          setStatus("live");
        }
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, []);

  const getStatusColor = (val, type) => {
    if (val === undefined || val === null) return "#94a3b8";
    if (type === "temp") return val > 30 ? "#fb7185" : "#60a5fa";
    if (type === "hum") return val < 30 ? "#fbbf24" : "#34d399";
    return "#94a3b8";
  };

  const isHot = data?.temperature > 35;

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <div style={{
          ...styles.badge,
          background:
            status === "live"
              ? "#10b981"
              : status === "error"
                ? "#ef4444"
                : "#f59e0b",
        }}>
          {status.toUpperCase()}
        </div>

        <h1 style={styles.title}>🌾 SmartFarm Pro</h1>
        <p style={styles.subtitle}>
          Field Monitoring • <strong>North Field</strong>
        </p>
      </header>

      <main style={styles.container}>
        {data ? (
          <>
            {/* ALERT BAR */}
            {isHot && (
              <div style={styles.alert}>
                ⚠ High Temperature Detected: {data.temperature}°C
              </div>
            )}

            <div style={styles.grid}>
              <StatCard
                label="Temperature"
                value={`${data.temperature ?? 0}°C`}
                icon="🌡️"
                color={getStatusColor(data.temperature, "temp")}
              />
              <StatCard
                label="Humidity"
                value={`${data.humidity ?? 0}%`}
                icon="💧"
                color={getStatusColor(data.humidity, "hum")}
              />
              <StatCard
                label="Brightness"
                value={data.brightness ?? 0}
                icon="💡"
                color="#facc15"
              />
            </div>

            <footer style={styles.footer}>
              <div style={styles.pulseDot}></div>
              Last update:{" "}
              {data?.created_at
                ? new Date(data.created_at).toLocaleTimeString()
                : "--"}
            </footer>
          </>
        ) : (
          <div style={styles.loader}>Waiting for sensor data...</div>
        )}
      </main>
    </div>
  );
}

// ================= COMPONENT =================
const StatCard = ({ label, value, icon, color }) => (
  <div style={styles.card}>
    <div style={{ ...styles.iconCircle, backgroundColor: `${color}22`, color }}>
      {icon}
    </div>

    <div>
      <p style={styles.cardLabel}>{label}</p>
      <h3 style={styles.cardValue}>{value}</h3>
    </div>
  </div>
);

// ================= STYLES =================
const styles = {
  page: {
    padding: "40px 20px",
    fontFamily: "'Inter', system-ui, sans-serif",
    background: "radial-gradient(circle at top right, #1e293b, #0f172a)",
    color: "#f8fafc",
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },

  header: {
    textAlign: "center",
    marginBottom: 40,
  },

  badge: {
    display: "inline-block",
    padding: "4px 12px",
    borderRadius: 20,
    fontSize: 10,
    fontWeight: "bold",
    letterSpacing: 1,
    marginBottom: 12,
  },

  title: {
    fontSize: "2.5rem",
    margin: 0,
    fontWeight: "800",
  },

  subtitle: {
    opacity: 0.6,
    fontSize: "1.1rem",
  },

  container: {
    width: "100%",
    maxWidth: 900,
  },

  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
    gap: 20,
    marginBottom: 30,
  },

  card: {
    background: "rgba(30, 41, 59, 0.7)",
    backdropFilter: "blur(10px)",
    border: "1px solid rgba(255,255,255,0.1)",
    padding: 24,
    borderRadius: 24,
    display: "flex",
    alignItems: "center",
    gap: 20,
    transition: "transform 0.2s ease",
  },

  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 18,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 24,
  },

  cardLabel: {
    margin: 0,
    fontSize: 14,
    color: "#94a3b8",
    textTransform: "uppercase",
  },

  cardValue: {
    margin: "4px 0 0 0",
    fontSize: "1.8rem",
    fontWeight: "700",
  },

  footer: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    fontSize: 13,
    color: "#64748b",
    marginTop: 20,
  },

  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: "50%",
    backgroundColor: "#10b981",
    boxShadow: "0 0 8px #10b981",
  },

  loader: {
    textAlign: "center",
    padding: 50,
    fontSize: 18,
    color: "#64748b",
  },

  alert: {
    marginBottom: 20,
    padding: 12,
    borderRadius: 12,
    background: "rgba(239, 68, 68, 0.15)",
    border: "1px solid rgba(239, 68, 68, 0.4)",
    color: "#fb7185",
    fontWeight: "bold",
    textAlign: "center",
  },
};

export default App;