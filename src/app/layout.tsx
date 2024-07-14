import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThirdwebProvider } from "thirdweb/react";
//import { Arbitrum } from "@thirdweb-dev/chains"; //全局使用beifen
const inter = Inter({ subsets: ["latin"] });
import { Arbitrum } from "@thirdweb-dev/chains";

export const metadata: Metadata = {
  title: "thirdweb SDK + Next starter",
  description:
    "Starter template for using thirdweb SDK with Next.js App router",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ThirdwebProvider>{children}</ThirdwebProvider>
      </body>
    </html>
  );
}
// export default function RootLayout({//留着给部署arbitrum备用
//   children,
// }: Readonly<{
//   children: React.ReactNode;
// }>) {
//   return (
//     <html lang="en">
//       <body className={inter.className}>
//         <ThirdwebProvider activeChain={Arbitrum}>{children}</ThirdwebProvider>
//       </body>
//     </html>
//   );
//}