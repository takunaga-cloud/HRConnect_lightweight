import SharedLayout from "@/components/layout/app-layout";

export default function UserLayout({
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
