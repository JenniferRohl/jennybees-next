import './globals.css';
import { CartProvider } from '../components/cart/CartContext';

export const metadata = {
  title: "Jenny Bees Creation",
  description: "Hand-poured soy-coconut candles by Jen.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div id="fb-root" /> {/* required by Facebook SDK */}
        <CartProvider>
          {children}
        </CartProvider>
      </body>
    </html>
  );
}