"use client";

import { useAuth } from "@clerk/nextjs";
import { useState } from "react";

export default function DebugPage() {
  const { getToken } = useAuth();
  const [response, setResponse] = useState<any>(null);

  const callMe = async () => {
    const token = await getToken({ template: "backend" });

    const res = await fetch("http://localhost:8000/me", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await res.json();
    setResponse(data);
  };

  return (
    <div className="p-10">
      <button
        onClick={callMe}
        className="rounded bg-black px-4 py-2 text-white"
      >
        Call /me
      </button>

      {response && (
        <pre className="mt-6 rounded bg-zinc-100 p-4 text-sm">
          {JSON.stringify(response, null, 2)}
        </pre>
      )}
    </div>
  );
}