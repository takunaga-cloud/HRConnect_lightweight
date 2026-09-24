import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { AUTH_COOKIE_NAME } from "@/lib/constants";

let BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8000";
if (!process.env.BACKEND_URL && process.env.NEXT_PUBLIC_BACKEND_URL) {
    BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL.replace(/\/api\/v1\/?$/, "");
}

async function handleProxy(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
    const { path } = await params;
    const cookieStore = await cookies();
    const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;

    console.log(`[Proxy] Incoming request: ${request.method} ${request.url}`);
    console.log(`[Proxy] Token cookie found: ${token ? "YES (starts with " + token.substring(0, 10) + "...)" : "NO"}`);

    const searchParams = request.nextUrl.search;
    const backendPath = path.join("/");
    const originalPathname = new URL(request.url).pathname;
    const hasTrailingSlash = originalPathname.endsWith("/");
    const targetUrl = new URL(`${BACKEND_URL}/api/v1/${backendPath}${hasTrailingSlash ? "/" : ""}`);
    targetUrl.search = searchParams;

    const normalizedTargetUrl = targetUrl.toString();

    console.log(`[Proxy] Proxying to backend: ${normalizedTargetUrl}`);

    const headers = new Headers(request.headers);
    headers.delete("host");

    if (token) {
        headers.set("Authorization", `Bearer ${token}`);
    } else {
        console.warn(`[Proxy] No token found in cookies, sending request without Authorization header`);
    }

    try {
        let body: any = undefined;
        if (!["GET", "HEAD"].includes(request.method)) {
            const arrayBuffer = await request.arrayBuffer();
            body = Buffer.from(arrayBuffer);
        }

        headers.delete("content-length");

        const response = await fetch(normalizedTargetUrl, {
            method: request.method,
            headers: headers,
            body: body,
            cache: 'no-store',
        });

        console.log(`[Proxy] Backend response status: ${response.status} ${response.statusText}`);

        const resData = await response.arrayBuffer();

        const resHeaders = new Headers(response.headers);
        resHeaders.delete("content-encoding");
        resHeaders.delete("content-length");

        const bodyContent = response.status === 204 ? null : resData;

        return new NextResponse(bodyContent, {
            status: response.status,
            statusText: response.statusText,
            headers: resHeaders,
        });

    } catch (error: any) {
        console.error(`Proxy Error (${request.method} ${targetUrl}):`, error);
        return NextResponse.json(
            { error: "Backend communication error", details: error.message },
            { status: 502 }
        );
    }
}

export const GET = handleProxy;
export const POST = handleProxy;
export const PUT = handleProxy;
export const DELETE = handleProxy;
export const PATCH = handleProxy;
