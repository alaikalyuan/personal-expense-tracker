import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "SakuTrack : Student Budget Tracker",
    short_name: "SakuTrack",
    description: "Catat pengeluaran mingguan kuliah dan pribadi",
    start_url: "/",
    id: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    // Cream paper, matching the default light theme (see DESIGN.md).
    background_color: "#fff8ec",
    theme_color: "#fff8ec",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      // Maskable versions keep the logo inside the safe zone so launchers can crop them.
      { src: "/icons/icon-maskable-192.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
