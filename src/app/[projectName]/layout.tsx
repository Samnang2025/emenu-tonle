import type { Metadata } from "next";

import "../globals.css";
import I18nProvider from "@/lib/i18n";
import "../../../public/fonts/style.css";

export const preferredRegion = "sin1";
export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Tonle Coffee",
  icons: "https://tonle-coffee.pos.tsdsolution.net/assets/uploads/logos/logo532.png",
};

export default function RootLayout({
  children,
}: Readonly<{
  params: { projectName: string };
  children: React.ReactNode;
}>) {
  return (
    <html lang="kh" className="scroll-smooth">
      <head>
        <link
          rel="preconnect"
          href="https://tonle-coffee.pos.tsdsolution.net"
          crossOrigin="anonymous"
        />
        <link
          rel="dns-prefetch"
          href="https://tonle-coffee.pos.tsdsolution.net"
        />
      </head>
      <body className="m-auto max-w-[575px]">
        <div className="h-screen bg-white overflow-auto max-w-[575px] w-full">
          <I18nProvider>{children}</I18nProvider>
        </div>
      </body>
    </html>
  );
}
