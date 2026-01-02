"use client";

import { useState } from "react";

export default function Home() {
  const [message, setMessage] = useState<string>("");

  async function handleClick() {
    const res = await fetch("/api/hello");
    const data = await res.json();
    setMessage(data.message);
  }

  return (
    <>
      <button onClick={handleClick}>
        Call Python
      </button>

      {message && (
        <p style={{ marginTop: 16 }}>
          {message}
        </p>
      )}
    </>
  );
}
