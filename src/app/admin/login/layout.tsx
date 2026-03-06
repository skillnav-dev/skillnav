export default function AdminLoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Render login page without the admin chrome (nav bar etc.)
  return <>{children}</>;
}
