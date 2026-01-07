"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"

export default function About() {
  const [inputText, setInputText] = useState("");
  const [outputText, setOutputText] = useState("");
  const [loading, setLoading] = useState(false);

  async function translate(text: string) {
    setLoading(true);

    const res = await fetch("/api/translate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text })
    });

    const data = await res.json();
    setOutputText(data.result);
    setLoading(false);
  }

  return (
    <div className="min-h-screen grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
      {/* LEFT */}
      <Card>
        <CardHeader>
          <CardTitle>Left Text</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="Type something..."
            className="min-h-screen"
            value={inputText}
            onChange={(e) => {
              const text = e.target.value;
              setInputText(text);
              translate(text);
            }}
          />
        </CardContent>
      </Card>

      {/* RIGHT */}
      <Card>
        <CardHeader>
          <CardTitle>Right Text</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder={loading ? "Processing..." : "Waiting for input..."}
            className="min-h-screen"
            value={outputText}
            readOnly
          />
        </CardContent>
      </Card>
    </div>
  );
}
