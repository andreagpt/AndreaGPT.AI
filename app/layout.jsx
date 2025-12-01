import "./globals.css";

export const metadata = {
  title: "AndreaGPT",
  description: "Chat sencillo con AndreaGPT",
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
