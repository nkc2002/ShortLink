import { useState, useContext } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../App";
import api from "../api";

function Home() {
  const { user } = useAuth();
  const [url, setUrl] = useState("");
  const [shortUrl, setShortUrl] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setShortUrl("");
    setLoading(true);
    setCopied(false);

    try {
      const response = await api.post("/api/shorten", { url });
      setShortUrl(response.data.shortUrl);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to shorten URL");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shortUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  return (
    <div className="home">
      <h1>🔗 ShortLink</h1>
      <p>Shorten your URLs quickly and share them easily</p>

      <form onSubmit={handleSubmit}>
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Paste your long URL here..."
          required
        />
        <button type="submit" disabled={loading}>
          {loading ? "⏳ Shortening..." : "✨ Shorten"}
        </button>
      </form>

      {error && <p className="error">⚠️ {error}</p>}

      {shortUrl && (
        <div className="result">
          <p>✅ Your shortened URL is ready!</p>
          <a href={shortUrl} target="_blank" rel="noopener noreferrer">
            {shortUrl}
          </a>
          <button
            onClick={copyToClipboard}
            style={{
              marginTop: "1rem",
              padding: "0.5rem 1rem",
              background: copied ? "#22c55e" : "#6366f1",
              color: "white",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              fontSize: "0.9rem",
              fontWeight: "500",
            }}
          >
            {copied ? "✓ Copied!" : "📋 Copy"}
          </button>
        </div>
      )}

      {!user && (
        <p style={{ color: "#64748b", marginTop: "2rem" }}>
          <Link to="/register">Create an account</Link> to track your links and
          view analytics
        </p>
      )}

      {user && (
        <p style={{ color: "#64748b", marginTop: "2rem" }}>
          <Link to="/history">View your link history →</Link>
        </p>
      )}
    </div>
  );
}

export default Home;
