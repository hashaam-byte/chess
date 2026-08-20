import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "../components/ThemeProvider";
import ThemeSwitcher from "../components/ThemeSwitcher";

export const metadata: Metadata = {
  title: "CHESS//X",
  description: "Play. Watch. Compete. A chess arena for tournaments, live matches, and rankings.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col" style={{ background: "#07070A" }}>
        <ThemeProvider>
          {children}
          <ThemeSwitcher />
        </ThemeProvider>
      </body>
    </html>
  );
}
