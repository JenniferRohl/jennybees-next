// app/success/page.tsx
import Link from "next/link";
import Image from "next/image";

export default function SuccessPage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center text-center px-6 py-16">
      <div className="animate-bounce mb-6">
        <Image
          src="/bee.gif" // <--- add your bee gif to /public folder
          alt="Bee"
          width={80}
          height={80}
        />
      </div>

      <h1 className="text-4xl font-bold mb-4">
        Thanks! <span className="text-yellow-500">Your order is buzzing 🐝</span>
      </h1>

      <p className="text-lg text-neutral-600 max-w-xl mb-10">
        Jen is already packing up your candles with love. We’ll send tracking as soon as your order ships. 
        Thank you for supporting our small business 💛
      </p>

      <div className="flex flex-col gap-4">
        <Link
          href="/"
          className="px-6 py-3 rounded-md text-white font-semibold"
          style={{ background: "#b76e79" }}
        >
          Return to Home
        </Link>

        <a
          href="https://www.tiktok.com/@jennybeescreation"
          target="_blank"
          className="px-6 py-3 rounded-md border border-neutral-300 text-neutral-700 font-semibold hover:bg-neutral-100"
        >
          Follow Us on TikTok 🎥🐝
        </a>
      </div>
    </main>
  );
}
