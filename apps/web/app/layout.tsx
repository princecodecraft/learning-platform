import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
export const metadata: Metadata = { title: { default: "LearnSpace — Learn by building", template: "%s | LearnSpace" }, description: "Practical courses to help you build real-world skills." };
export default function RootLayout({ children }: { children: ReactNode }) { return <html lang="en"><body>{children}</body></html>; }
