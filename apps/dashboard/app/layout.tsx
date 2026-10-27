import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
export const metadata: Metadata = { title: "SkillSpring Admin | Learning Platform", description: "Manage courses, lessons, users and payments." };
export default function RootLayout({children}:{children:ReactNode}) { return <html lang="en"><body>{children}</body></html>; }
