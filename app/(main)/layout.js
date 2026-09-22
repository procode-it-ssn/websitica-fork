import { Spicy_Rice } from "next/font/google";
import "./../globals.css";
import Providers from "@/context/Providers";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import InventeBackground from "@/components/InventeBackground";

const spicyRice = Spicy_Rice({
  weight: ["400"],
  variable: "--font-spicyRice",
  subsets: ["latin"],
});

export const metadata = {
  title: "Websitica | Invente '26 • Codections",
  description: "Out Think. Out Build. Out Shine. The official technical event puzzle competition of SSN-SNUC Invente '26.",
  icons: {
    icon: "/invente/invente-orange.webp",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`font-mono bg-[#FFF9F3] text-[#101010] bg-grid min-h-screen selection:bg-[#FFD12E] selection:text-[#101010] ${spicyRice.variable}`}>
        <Providers>
          <div className="flex flex-col min-h-screen relative overflow-x-hidden">
            {/* Global festival collage background: animated VHS cassettes, rotating smiley badge & 10 floating stickers */}
            <InventeBackground />
            <Navbar />
            <main className="flex-1 relative z-10">{children}</main>
            <Footer />
          </div>
        </Providers>
      </body>
    </html>
  );
}
