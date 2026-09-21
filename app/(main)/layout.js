import "./../globals.css";
import Providers from "@/context/Providers";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export const metadata = {
  title: "INVENTE '26 // WEBSITICA - CODECTIONS",
  description: "Out Think. Out Build. Out Shine. The official technical event puzzle competition of SSN-SNUC Invente '26.",
  icons: {
    icon: "/invente/invente-orange.webp",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="font-mono bg-[#FFF9F3] text-[#101010] bg-grid min-h-screen selection:bg-[#FFD12E] selection:text-[#101010]">
        <Providers>
          <div className="flex flex-col min-h-screen">
            <Navbar />
            <main className="flex-1">{children}</main>
            <Footer />
          </div>
        </Providers>
      </body>
    </html>
  );
}
