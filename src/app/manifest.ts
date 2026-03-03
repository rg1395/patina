import { MetadataRoute } from "next";
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Patina — Ricambi Classici",
    short_name: "Patina",
    description: "Il marketplace europeo per ricambi auto e moto d'epoca.",
    start_url: "/",
    display: "standalone",
    background_color: "#F5F0E8",
    theme_color: "#1A1612",
    orientation: "portrait",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    screenshots: [
      { src: "/screenshot-mobile.png", sizes: "390x844", type: "image/png" },
    ],
    categories: ["shopping", "lifestyle"],
    lang: "it",
  };
}
