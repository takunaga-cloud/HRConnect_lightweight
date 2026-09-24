import { NextResponse } from "next/server";
import { cookies } from "next/headers";

let BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8000";
if (!process.env.BACKEND_URL && process.env.NEXT_PUBLIC_BACKEND_URL) {
    BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL.replace(/\/api\/v1\/?$/, "");
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { username, password } = body;

        const formData = new URLSearchParams();
        formData.append("username", username);
        formData.append("password", password);

        const res = await fetch(`${BACKEND_URL}/api/v1/login/access-token`, {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: formData.toString(),
        });

        if (!res.ok) {
            const errorData = await res.json().catch(() => ({ detail: "Unknown error" }));
            return NextResponse.json({ detail: errorData.detail || "Authentication failed" }, { status: res.status });
        }

        const data = await res.json();
        const token = data.access_token;

        // HttpOnlyクッキーを設定
        const response = NextResponse.json({ success: true });

        // クッキー設定
        const cookieStore = await cookies();
        cookieStore.set("token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            path: "/",
            sameSite: "lax",
        });

        return response;

    } catch (error: any) {
        console.error("Login route error:", error, "Cause:", error?.cause);
        return NextResponse.json({ error: "Internal Server Error", details: error?.message }, { status: 500 });
    }
}

