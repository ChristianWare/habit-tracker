import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { Toaster } from "react-hot-toast";
import "./globals.css";

const SofiaSansExtraCondensedBold = localFont({
  src: "../../public/fonts/SofiaSansExtraCondensed-Bold.ttf",
  variable: "--SofiaSansExtraCondensedBold",
  display: "swap",
});

const SofiaSansExtraCondensedExtraBold = localFont({
  src: "../../public/fonts/SofiaSansExtraCondensed-ExtraBold.ttf",
  variable: "--SofiaSansExtraCondensedExtraBold",
  display: "swap",
});

const SofiaSansRegular = localFont({
  src: "../../public/fonts/SofiaSans-Regular.ttf",
  variable: "--SofiaSansRegular",
  display: "swap",
});

const SofiaSansBold = localFont({
  src: "../../public/fonts/SofiaSans-Bold.ttf",
  variable: "--SofiaSansBold",
  display: "swap",
});

export const metadata: Metadata = {
  title: { default: "Habit Tracker", template: "%s | Habit Tracker" },
  description: "Your habits, tasks, food and mood in one place.",
  robots: { index: false, follow: false },
  appleWebApp: {
    capable: true,
    title: "Habits",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang='en'>
      <body
        className={`${SofiaSansExtraCondensedBold.variable} ${SofiaSansExtraCondensedExtraBold.variable} ${SofiaSansRegular.variable} ${SofiaSansBold.variable}`}
      >
        {children}
        <Toaster
          position='bottom-center'
          containerStyle={{
            bottom: "calc(84px + env(safe-area-inset-bottom))",
          }}
          toastOptions={{
            duration: 2500,
            style: {
              borderRadius: "4px",
              background: "#0b0f1a",
              color: "#f7f5f0",
              fontFamily: "var(--SofiaSansRegular)",
              fontSize: "15px",
            },
          }}
        />
      </body>
    </html>
  );
}
