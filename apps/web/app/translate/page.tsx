"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button";

export default function About() {
  const [inputText, setInputText] = useState("");
  const [outputText, setOutputText] = useState("");
  const [alignText, setAlignText] = useState("");

  const [translationLoading, setTranslationLoading] = useState(false);
  const [alignmentLoading, setAlignmentLoading] = useState(false);

  async function translate() {
    if (!inputText.trim()) return;

    setTranslationLoading(true);
    
    const res = await fetch("/api/translate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ source: inputText })
    });

    const data = await res.json();
    setOutputText(data.result);
    setTranslationLoading(false);
  }

  async function align() {
    if (!inputText.trim() || !outputText.trim()) return;

    setAlignmentLoading(true);
    
    const res = await fetch("/api/align", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ 
        source: inputText, 
        target: outputText,
      })
    });

    const data = await res.json();
    setAlignText(JSON.stringify(data.alignments));
    setAlignmentLoading(false);

  }

  return (
    <div className="min-h-screen grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
      {/* LEFT inputText */}
      <Card>
        <CardHeader>
          <CardTitle>Left Text</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="Type something..."
            className="min-h-[50vh]"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
          />

          <Button onClick={translate} disabled={translationLoading}>
            {translationLoading ? "Translating..." : "Translate"}
          </Button>
        </CardContent>
      </Card>

      {/* RIGHT outputText */}
      <Card>
        <CardHeader>
          <CardTitle>Right Text</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder={translationLoading ? "Processing..." : "Waiting for input..."}
            className="min-h-[50vh]"
            value={outputText}
            readOnly
          />
        </CardContent>
      </Card>

      {/* BOTTOM alignments */}
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle>Alignments</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder={alignmentLoading ? "Aligning..." : "Waiting to align..."}
            className="min-h-[30vh]"
            value={alignText}
            readOnly
          />

          <Button onClick={align} disabled={alignmentLoading}>
            {alignmentLoading ? "Aligning..." : "Align"}
          </Button>
        </CardContent>
      </Card>

    </div>
  );
}
