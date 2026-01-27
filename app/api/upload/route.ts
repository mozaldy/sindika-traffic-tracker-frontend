import { NextRequest, NextResponse } from "next/server";

export const runtime = 'nodejs'; // Use Node.js runtime for streaming

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get("content-type");
    
    // Proxy request to backend, streaming the body
    const response = await fetch("http://localhost:8000/api/upload", {
      method: "POST",
      headers: {
        "Content-Type": contentType || "",
      },
      // @ts-ignore: explicit streaming support
      body: req.body, 
      duplex: "half", 
    });

    if (!response.ok) {
        const errorText = await response.text();
        return NextResponse.json(
            { error: `Backend error: ${response.status}`, details: errorText },
            { status: response.status }
        );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Upload proxy error:", error);
    return NextResponse.json(
      { error: "Upload failed", details: error.message },
      { status: 500 }
    );
  }
}
