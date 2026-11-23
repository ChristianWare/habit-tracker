import type { MetadataRoute } from "next";

// Lets you add the app to your iPhone or Android home screen.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Habit Tracker",
    short_name: "Habits",
    description: "Your habits, tasks, food and mood in one place.",
    start_url: "/",
    display: "standalone",
    background_color: "#f7f5f0",
    theme_color: "#ffffff",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
