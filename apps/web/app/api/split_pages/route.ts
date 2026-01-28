import { NextResponse } from "next/server";

export async function POST(req: Request) {
    const { text } = await req.json();

    const res = await fetch("http://localhost:8000/split_pages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
    });

    const data = await res.json();

    return NextResponse.json({ pages: data.pages });
}