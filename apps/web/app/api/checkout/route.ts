import { NextRequest, NextResponse } from "next/server";
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
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!url || !anon || !service || !keyId || !keySecret) return NextResponse.json({ error: "Checkout is not configured yet. Add Supabase server credentials and Razorpay keys in Vercel." }, { status: 503 });
    const authClient = createClient(url, anon);
    const { data: auth, error: authError } = await authClient.auth.getUser(token);
    if (authError || !auth.user) return NextResponse.json({ error: "Your session expired. Please sign in again." }, { status: 401 });
    const body = await request.json();
    if (typeof body.courseId !== "string") return NextResponse.json({ error: "Course is required." }, { status: 400 });
    const admin = createClient(url, service, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data: course, error: courseError } = await admin.from("courses").select("id,title,price_inr,published").eq("id", body.courseId).eq("published", true).single();
    if (courseError || !course) return NextResponse.json({ error: "Course not found or not published." }, { status: 404 });
    const { data: existing } = await admin.from("enrollments").select("id").eq("user_id", auth.user.id).eq("course_id", course.id).eq("status", "active").maybeSingle();
    if (existing) return NextResponse.json({ enrolled: true, message: "You already own this course." });
    const amount = Number(course.price_inr || 0) * 100;
    if (!Number.isSafeInteger(amount) || amount < 100) return NextResponse.json({ error: "This course has no valid paid price. Set price_inr to at least ₹1." }, { status: 400 });
    const orderResponse = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: "Basic " + Buffer.from(keyId + ":" + keySecret).toString("base64") },
      body: JSON.stringify({ amount, currency: "INR", receipt: "course_" + course.id.slice(0, 20), notes: { course_id: course.id, user_id: auth.user.id } }),
      cache: "no-store"
    });
    const order = await orderResponse.json();
    if (!orderResponse.ok) return NextResponse.json({ error: "Payment provider could not create an order." }, { status: 502 });
    const { error: saveError } = await admin.from("checkout_orders").insert({ user_id: auth.user.id, course_id: course.id, razorpay_order_id: order.id, amount_paise: amount, status: "created" });
    if (saveError) return NextResponse.json({ error: "Could not save checkout order. Check the database schema." }, { status: 500 });
    return NextResponse.json({ orderId: order.id, amount, currency: "INR", keyId, courseTitle: course.title });
  } catch {
    return NextResponse.json({ error: "Unable to start checkout. Please try again." }, { status: 500 });
  }
}
