import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import DashboardClient from "./DashboardClient";

// Helper to fetch data on server
async function getData(token: string) {
    const backendUrl = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000"; // Use internal URL for SS

    try {
        const [summaryRes, userRes] = await Promise.all([
            fetch(`${backendUrl}/api/v1/dashboard/my-summary`, {
                headers: { 'Authorization': `Bearer ${token}` },
                cache: 'no-store'
            }),
            fetch(`${backendUrl}/api/v1/users/me`, {
                headers: { 'Authorization': `Bearer ${token}` },
                cache: 'no-store'
            })
        ]);

        if (!summaryRes.ok || !userRes.ok) {
            console.error("Dashboard fetch failed", summaryRes.status, userRes.status);
            return null;
        }

        const summary = await summaryRes.json();
        const user = await userRes.json();

        return { summary, user };

    } catch (error) {
        console.error("Dashboard fetch error", error);
        return null;
    }
}

export default async function DashboardPage() {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
        redirect("/login");
    }

    const data = await getData(token);

    if (!data) {
        // Handle error or token invalidation
        // For now redirect to login if fetch fails (likely token expired)
        // redirect("/login"); 
        // Or show error state
        return <div>Failed to load dashboard data. Please try logging in again.</div>
    }

    return <DashboardClient user={data.user} summary={data.summary} />;
}
