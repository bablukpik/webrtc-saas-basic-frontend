export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="admin-layout">
      {/* Admin navigation or other layout elements */}
      <main>{children}</main>
    </div>
  );
} 