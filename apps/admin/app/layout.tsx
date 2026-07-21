import type { Metadata } from "next";
import "./styles.css";

export const metadata: Metadata = { title: "MMEMME Operations", description: "Internal managed-marketplace console" };
export default function Layout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="en"><body>{children}</body></html>; }
