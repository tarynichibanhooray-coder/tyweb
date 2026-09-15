/**
 * Next.js root layout
 */
export const metadata = {
  title: 'tyweb'
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
