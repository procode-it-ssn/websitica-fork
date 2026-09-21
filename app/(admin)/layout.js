import "./../globals.css";

export const metadata = {
  title: "INVENTE '26 // Admin Dashboard",
  description: "Websitica - Codections Admin Control Center",
  icons: {
    icon: "/invente/invente-orange.webp",
  },
};

export default async function AdminLayout({ children }) {
  return (
    <html lang="en">
      <body className="font-mono bg-[#FFF9F3] text-[#101010] bg-grid min-h-screen">
        {children}
      </body>
    </html>
  );
}
