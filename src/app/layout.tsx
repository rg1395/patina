import type { Metadata } from "next";
import "./globals.css";
import Nav from "@/components/layout/Nav";
import Footer from "@/components/layout/Footer";
import BottomNav from "@/components/layout/BottomNav";

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export const metadata: Metadata = {
  title: "Patina — Ricambi Classici d'Epoca",
  description: "Il marketplace europeo per ricambi auto e moto d'epoca. NOS, originali, restaurati. Compra e vendi con fiducia.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="it">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,900;1,700;1,900&family=Lora:ital,wght@0,400;0,600;1,400;1,600&family=DM+Mono:wght@300;400;500&display=swap" rel="stylesheet" />
        <style>{`
          @media (max-width: 768px) {
            .listing-grid { grid-template-columns: 1fr !important; padding: 1rem !important; gap: 1.5rem !important; }
            .listing-sidebar { position: static !important; width: 100% !important; }
            .listing-similar-grid { grid-template-columns: repeat(2,1fr) !important; }
            .listing-owners-grid { grid-template-columns: repeat(2,1fr) !important; }
            .garage-hero { padding: 2rem 1.2rem !important; }
            .garage-hero-inner { flex-direction: column !important; gap: 1rem !important; }
            .garage-content { padding: 2rem 1.2rem !important; }
            .garage-vehicle-card { grid-template-columns: 1fr !important; }
            .garage-parts-grid { grid-template-columns: 1fr !important; }
            .garage-listings-grid { grid-template-columns: 1fr !important; }
            .search-layout { grid-template-columns: 1fr !important; padding: 1rem !important; }
            .search-filters { display: none !important; }
            .profile-hero-inner { flex-direction: column !important; gap: 1rem !important; }
            .profile-content { padding: 2rem 1.2rem !important; grid-template-columns: 1fr !important; }
            .rubriche-hero { grid-template-columns: 1fr !important; }
            .rubriche-grid { grid-template-columns: 1fr !important; }
            .search-row { flex-direction: column !important; border-radius: 16px !important; padding: .5rem !important; }
            .search-select { display: none !important; }
            .search-divider { display: none !important; }
            .search-btn { width: 100% !important; border-radius: 12px !important; padding: .9rem !important; }
          }
          @media (max-width: 480px) {
            .listing-similar-grid { grid-template-columns: 1fr !important; }
            .listing-owners-grid { grid-template-columns: 1fr !important; }
          }
        `}</style>
      </head>
      <body>
        <Nav />
        <main>{children}</main>
        <Footer />
        <BottomNav />
      </body>
    </html>
  );
}
