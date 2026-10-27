"use client";
import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getSupabase } from "../../lib/supabase";
export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const supabase = getSupabase();
  useEffect(() => { if (supabase) supabase.auth.getSession().then(({data}) => { if (data.session) router.replace("/my-learning"); }); }, [router, supabase]);
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault(); setMessage("");
    if (!supabase) { setMessage("Setup pending: add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to the Vercel public-site environment variables."); return; }
    setBusy(true);
    try {
      const next = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("next") : null;
      if (mode === "signup") {
        const {data,error} = await supabase.auth.signUp({email,password,options:{data:{full_name:name}}});
        if(error) throw error;
        if(!data.session) setMessage("Account created. Check your email to confirm your account, then sign in.");
        else router.push(next || "/my-learning");
      } else {
        const {error} = await supabase.auth.signInWithPassword({email,password});
        if(error) throw error;
        router.push(next || "/my-learning");
      }
    } catch(err) { setMessage(err instanceof Error ? err.message : "Something went wrong. Please try again."); }
    finally { setBusy(false); }
  }
  return <main className="auth-shell"><section className="auth-card">
    <Link className="brand" href="/">skill<span>spring</span><i>.</i></Link>
    <div className="eyebrow" style={{marginTop:28}}>{mode === "login" ? "WELCOME BACK" : "START LEARNING TODAY"}</div>
    <h1>{mode === "login" ? "Sign in to learn." : "Create your account."}</h1>
    <p>{mode === "login" ? "Pick up where you left off and continue your learning journey." : "Create an account to explore courses and keep your learning in one place."}</p>
    {!supabase && <div className="notice">Login interface is ready. Connect Supabase Auth in Vercel to activate real accounts.</div>}
    {message && <div className={"notice " + (/pending|created/i.test(message) ? "" : "error-notice")} role="status">{message}</div>}
    <form className="auth-form" onSubmit={submit}>
      {mode === "signup" && <label>Full name<input value={name} onChange={e=>setName(e.target.value)} autoComplete="name" required placeholder="Your name"/></label>}
      <label>Email address<input type="email" value={email} onChange={e=>setEmail(e.target.value)} autoComplete="email" required placeholder="you@example.com"/></label>
      <label>Password<input type="password" value={password} onChange={e=>setPassword(e.target.value)} autoComplete={mode === "login" ? "current-password" : "new-password"} minLength={8} required placeholder="At least 8 characters"/></label>
      <button className="btn" type="submit" disabled={busy}>{busy ? "Please wait…" : mode === "login" ? "Sign in" : "Create account"} <span>→</span></button>
    </form>
    <div className="auth-switch">{mode === "login" ? "New to SkillSpring? " : "Already have an account? "}<button onClick={()=>{setMode(mode === "login" ? "signup" : "login");setMessage("");}}>{mode === "login" ? "Create an account" : "Sign in"}</button></div>
    <p style={{textAlign:"center",fontSize:".8rem",marginTop:24}}>By continuing, you agree to our learning platform terms.</p>
  </section></main>;
}
