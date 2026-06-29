import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    keyId: process.env.RAZORPAY_KEY_ID ?? null,
    hasSecret: !!process.env.RAZORPAY_KEY_SECRET,
  });
}
