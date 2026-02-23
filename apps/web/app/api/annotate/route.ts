import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const req_data = await req.json();

    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

  const res = await fetch(`${API_BASE_URL}/annotate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(req_data),
  });

  const res_data = await res.json();

  return NextResponse.json(res_data, { status: res.status });
}
