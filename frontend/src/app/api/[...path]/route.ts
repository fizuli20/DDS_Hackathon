import { NextRequest, NextResponse } from "next/server";

const backendBaseUrl = process.env.BACKEND_API_URL || "http://localhost:3001/api";

function buildTargetUrl(path: string[], search: string) {
  const normalizedBase = backendBaseUrl.endsWith("/")
    ? backendBaseUrl.slice(0, -1)
    : backendBaseUrl;
  const joinedPath = path.join("/");
  return `${normalizedBase}/${joinedPath}${search || ""}`;
}

async function proxy(request: NextRequest, path: string[]) {
  try {
    const targetUrl = buildTargetUrl(path, request.nextUrl.search);
    const requestHeaders = new Headers(request.headers);
    requestHeaders.delete("host");

    const hasBody = !["GET", "HEAD"].includes(request.method);
    const response = await fetch(targetUrl, {
      method: request.method,
      headers: requestHeaders,
      body: hasBody ? request.body : undefined,
      redirect: "follow",
      // Required when forwarding request.body streams in route handlers.
      duplex: hasBody ? "half" : undefined,
    } as RequestInit & { duplex?: "half" });

    const responseHeaders = new Headers(response.headers);
    responseHeaders.delete("content-encoding");
    responseHeaders.delete("content-length");

    return new NextResponse(response.body, {
      status: response.status,
      headers: responseHeaders,
    });
  } catch {
    return NextResponse.json(
      {
        message:
          "Backend API is unreachable. Check BACKEND_API_URL and backend deployment health.",
      },
      { status: 502 },
    );
  }
}

export async function GET(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  const { path } = await context.params;
  return proxy(request, path);
}

export async function POST(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  const { path } = await context.params;
  return proxy(request, path);
}

export async function PUT(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  const { path } = await context.params;
  return proxy(request, path);
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  const { path } = await context.params;
  return proxy(request, path);
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  const { path } = await context.params;
  return proxy(request, path);
}

export async function OPTIONS(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  const { path } = await context.params;
  return proxy(request, path);
}
