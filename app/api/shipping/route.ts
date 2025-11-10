import { NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
  const form = await req.formData();
  const name = form.get("name");
  const address = form.get("address");
  const city = form.get("city");
  const state = form.get("state");
  const zip = form.get("zip");
  const phone = form.get("phone") || "Not provided";

  const message = `
New Order Shipping Information:

Name: ${name}
Address: ${address}
City: ${city}
State: ${state}
ZIP: ${zip}
Phone: ${phone}
`;

  await resend.emails.send({
    from: "Jenny Bees Website <mail@jennybeescreation.com>",
    to: "jenny@jennybeescreation.com",
    subject: "New Order - Shipping Info",
    text: message,
  });

  return NextResponse.redirect("/order-confirmed");
}
