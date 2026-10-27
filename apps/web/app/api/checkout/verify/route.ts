import { NextRequest, NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
    if (!token) return NextResponse.json({ error: "Please sign in first." }, { status: 401 });
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const keyId = process.env.RAZORPAY_KEY_ID;
    const secret = process.env.RAZORPAY_KEY_SECRET;
    if (!url || !anon || !service || !keyId || !secret) return NextResponse.json({ error: "Payment verification is not configured." }, { status: 503 });
    const authClient = createClient(url, anon);
    const { data: auth, error: authError } = await authClient.auth.getUser(token);
    if (authError || !auth.user) return NextResponse.json({ error: "Your session expired." }, { status: 401 });
    const body = await request.json();
    const { razorpay_order_id: orderId, razorpay_payment_id: paymentId, razorpay_signature: signature } = body;
    if (![orderId, paymentId, signature].every(v => typeof v === "string" && v.length > 0)) return NextResponse.json({ error: "Payment verification details are incomplete." }, { status: 400 });
    const expected = createHmac("sha256", secret).update(orderId + "|" + paymentId).digest("hex");
    const a = Buffer.from(expected); const b = Buffer.from(signature);
    if (a.length !== b.length || !timingSafeEqual(a, b)) return NextResponse.json({ error: "Payment signature is invalid." }, { status: 400 });
    const admin = createClient(url, service, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data: order, error: orderError } = await admin.from("checkout_orders").select("*").eq("razorpay_order_id", orderId).eq("user_id", auth.user.id).single();
    if (orderError || !order) return NextResponse.json({ error: "Checkout order not found for this account." }, { status: 404 });
    if (order.status !== "paid") {
      const paymentResponse = await fetch("https://api.razorpay.com/v1/payments/" + encodeURIComponent(paymentId), {
        headers: { Authorization: "Basic " + Buffer.from(keyId + ":" + secret).toString("base64") }, cache: "no-store"
      });
      const payment = await paymentResponse.json();
      if (!paymentResponse.ok || payment.order_id !== orderId || payment.amount !== order.amount_paise || payment.currency !== "INR" || !["captured", "authorized"].includes(payment.status)) {
        return NextResponse.json({ error: "Payment is not verified/captured yet." }, { status: 400 });
      }
      const { error: enrollmentError } = await admin.from("enrollments").upsert({ user_id: auth.user.id, course_id: order.course_id, status: "active" }, { onConflict: "user_id,course_id" });
      if (enrollmentError) return NextResponse.json({ error: "Payment was received but enrollment could not be saved. Contact support with payment ID " + paymentId }, { status: 500 });
      await admin.from("checkout_orders").update({ status: "paid" }).eq("id", order.id);
    }
    return NextResponse.json({ success: true, redirect: "/my-learning" });
  } catch {
    return NextResponse.json({ error: "Could not verify this payment. Contact support if money was deducted." }, { status: 500 });
  }
}
