"use client";
import { useEffect, useState } from "react";

export default function BrowserWarning() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const ua = window.navigator.userAgent;
    const isChrome =
      /Chrome/.test(ua) &&
      !/Edg/.test(ua) &&
      !/OPR/.test(ua) &&
      !/Brave/.test(ua) &&
      !/Chromium/.test(ua);
    if (!isChrome) setShow(true);
  }, []);

  if (!show) return null;

  return (
    <div
      style={{
        position: "fixed",
        bottom: 24,
        right: 24,
        zIndex: 99999,
        background: "#fff",
        color: "#222",
        border: "1px solid #e5e7eb",
        borderRadius: 8,
        boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
        padding: "16px 24px",
        fontSize: 16,
        display: "flex",
        alignItems: "center",
        gap: 12,
      }}
    >
      <svg
        width="24"
        height="24"
        fill="none"
        viewBox="0 0 24 24"
        style={{ marginRight: 8 }}
      >
        <circle cx="12" cy="12" r="12" fill="#4285F4" />
        <path
          d="M12 2v10l8.66 5"
          stroke="#fff"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
      For the best experience, please use <b>Google Chrome</b>.
      <a
        href="https://www.google.com/chrome/"
        target="_blank"
        rel="noopener noreferrer"
        style={{
          marginLeft: 12,
          background: "#4285F4",
          color: "#fff",
          border: "none",
          borderRadius: 4,
          padding: "6px 14px",
          fontWeight: 500,
          textDecoration: "none",
          fontSize: 15,
          boxShadow: "0 1px 2px rgba(0,0,0,0.07)",
          transition: "background 0.2s",
          display: "inline-block",
        }}
      >
        Download Chrome
      </a>
      <button
        onClick={() => setShow(false)}
        style={{
          marginLeft: 16,
          background: "none",
          border: "none",
          fontSize: 18,
          cursor: "pointer",
          color: "#888",
        }}
        aria-label="Close"
      >
        ×
      </button>
    </div>
  );
}
