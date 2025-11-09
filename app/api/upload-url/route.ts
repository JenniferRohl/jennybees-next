// app/api/upload-url/route.ts
import { NextResponse } from "next/server";
import { generateUploadUrl } from "@vercel/blob/server";

// Optional: restrict who can call this (cookie/session check) if you want.
export async function POST(req: Request) {
  const { filename, contentType } = await req.json();

  // Create a one-time signed URL the browser can PUT the file to.
  const { url, uploadUrl } = await generateUploadUrl({
    contentType,
    access: "public",             // public HTTPS URL
    // If your project has a Blob binding, no token needed.
    // If not, add: token: process.env.BLOB_READ_WRITE_TOKEN
  });

  // `url` is the final public file URL (without the file yet).
  // `uploadUrl` is the pre-signed URL to PUT the bytes to.
  return NextResponse.json({ url, uploadUrl });
}
