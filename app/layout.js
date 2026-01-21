import { Geist, Geist_Mono } from "next/font/google"; //importing google fonts
import "./globals.css"; //importing global styles
import { AuthProvider } from "@/contexts/AuthContext"; //importing auth provider

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
}); //setting up google fonts

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
}); //setting up google fonts

export const metadata = {
  title: "DocFix",
  description: "DocFix - Document Processing Application", //metadata for the app
};

export default function RootLayout({ children }) { //childrent -> all the pages that will contains inside this layout
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <AuthProvider>
          {/* by wrapping this we can use the useAuth anywhere in the app */}
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
