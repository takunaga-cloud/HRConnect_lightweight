import SharedLayout from "@/components/layout/app-layout";

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <SharedLayout>
            {children}
        </SharedLayout>
    );
}
