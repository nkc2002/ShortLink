import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../api";

function History() {
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const response = await api.get("/api/shorten/history");
        setLinks(response.data.links || []);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to fetch history");
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, []);

  if (loading) {
    return (
      <div className="history">
        <h1>📊 URL History</h1>
        <p style={{ color: "#64748b" }}>Loading your links...</p>
      </div>
    );
  }

  return (
    <div className="history">
      <h1>📊 URL History</h1>
      <Link to="/">← Back to Home</Link>

      {error && <p className="error">⚠️ {error}</p>}

      {links.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: "3rem",
            background: "#fff",
            borderRadius: "16px",
            border: "1px solid #e2e8f0",
            marginTop: "1rem",
          }}
        >
          <p style={{ fontSize: "3rem", marginBottom: "1rem" }}>🔗</p>
          <p style={{ color: "#64748b", fontSize: "1.1rem" }}>
            No shortened URLs yet.
          </p>
          <Link
            to="/"
            style={{
              display: "inline-block",
              marginTop: "1rem",
              padding: "0.75rem 1.5rem",
              background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
              color: "white",
              borderRadius: "10px",
              fontWeight: "600",
            }}
          >
            Create your first link
          </Link>
        </div>
      ) : (
        <ul>
          {links.map((link) => (
            <li key={link.id}>
              <a href={link.shortUrl} target="_blank" rel="noopener noreferrer">
                {link.shortUrl}
              </a>
              <span className="clicks">👆 {link.clicks} clicks</span>
              <span>
                →{" "}
                {link.originalUrl.length > 60
                  ? link.originalUrl.substring(0, 60) + "..."
                  : link.originalUrl}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default History;
