import { NextRequest, NextResponse } from "next/server";

const API_BASE = process.env.MCP_API_URL || "http://localhost:4000";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params;
  const authHeader = req.headers.get("authorization");

  if (!authHeader) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Missing bearer token" } },
      { status: 401 }
    );
  }

  try {
    const res = await fetch(`${API_BASE}/exported-prompts?projectId=${projectId}`, {
      headers: { Authorization: authHeader },
    });

    if (!res.ok) {
      const error = await res.json();
      return NextResponse.json({ error }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching exported prompts:", error);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Failed to fetch exported prompts" } },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params;
  const authHeader = req.headers.get("authorization");

  if (!authHeader) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Missing bearer token" } },
      { status: 401 }
    );
  }

  try {
    const body = await req.json();
    
    const res = await fetch(`${API_BASE}/exported-prompts`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: authHeader,
      },
      body: JSON.stringify({
        ...body,
        projectId,
      }),
    });

    if (!res.ok) {
      const error = await res.json();
      return NextResponse.json({ error }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error creating exported prompt:", error);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Failed to create exported prompt" } },
      { status: 500 }
    );
  }
}
