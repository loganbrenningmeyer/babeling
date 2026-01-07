"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button";

export default function About() {
  const [inputText, setInputText] = useState("");
  const [outputText, setOutputText] = useState("");
  const [loading, setLoading] = useState(false);

  async function translate() {
    if (!inputText.trim()) return;

    setLoading(true);
    
    const res = await fetch("/api/translate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text: inputText })
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
            className="min-h-[70vh]"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
          />

          <Button onClick={translate} disabled={loading}>
            {loading ? "Translating..." : "Translate"}
          </Button>
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
