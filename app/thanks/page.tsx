export default function Thanks() {
  return (
    <div className="max-w-xl mx-auto p-6 text-center">
      <h1 className="text-3xl font-semibold mb-4">Thank you for your order! 🎉</h1>
      <p className="mb-6">We just need your shipping information to complete the order.</p>

      <form action="/api/shipping" method="POST" className="grid gap-4 text-left">
        <input name="name" placeholder="Full Name" required className="border p-2 rounded" />
        <input name="address" placeholder="Street Address" required className="border p-2 rounded" />
        <input name="city" placeholder="City" required className="border p-2 rounded" />
        <input name="state" placeholder="State" required className="border p-2 rounded" />
        <input name="zip" placeholder="ZIP Code" required className="border p-2 rounded" />
        <input name="phone" placeholder="Phone (optional)" className="border p-2 rounded" />

        <button className="bg-rose-500 hover:bg-rose-600 text-white px-4 py-2 rounded">
          Submit Shipping Details
        </button>
      </form>
    </div>
  );
}
