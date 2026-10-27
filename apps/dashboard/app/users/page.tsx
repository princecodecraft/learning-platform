"use client";
import { useEffect,useState } from "react";
import AdminFrame from "../admin-frame";
import { getSupabase } from "../../lib/supabase";
type Profile={id:string;email:string|null;full_name:string|null;role:string;created_at:string};
export default function UsersAdmin(){
 const[rows,setRows]=useState<Profile[]>([]);const[search,setSearch]=useState("");const[message,setMessage]=useState("");
 async function load(){const s=getSupabase();if(!s)return;const{data,error}=await s.from("profiles").select("id,email,full_name,role,created_at").order("created_at",{ascending:false});if(error)setMessage("Could not load users. Apply the latest Supabase schema and admin RLS policy.");else setRows((data||[]) as Profile[]);}
 useEffect(()=>{load()},[]);
 async function setRole(user:Profile,role:string){if(user.role==="admin"&&role!=="admin"&&!confirm("Remove administrator access from this account?"))return;const s=getSupabase();if(!s)return;const{error}=await s.from("profiles").update({role}).eq("id",user.id);setMessage(error?error.message:"User role updated.");if(!error)await load();}
 const filtered=rows.filter(u=>[u.email,u.full_name,u.id].some(v=>v?.toLowerCase().includes(search.toLowerCase())));
 return <AdminFrame><div className="welcome-row"><div><div className="admin-eyebrow">ACCOUNT MANAGEMENT</div><h1>Users</h1><p>Review learner accounts and manage platform roles.</p></div><span className="admin-count">{rows.length} accounts</span></div><section className="panel-card admin-content-card"><div className="admin-toolbar"><input className="admin-search" placeholder="Search name, email or user ID…" value={search} onChange={e=>setSearch(e.target.value)}/><span className="muted">{filtered.length} results</span></div>{message&&<div className="notice">{message}</div>}<div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>User</th><th>Joined</th><th>Role</th><th>Change role</th></tr></thead><tbody>{filtered.map(u=><tr key={u.id}><td><strong>{u.full_name||"Learner"}</strong><small className="table-subtitle">{u.email||u.id}</small></td><td>{new Date(u.created_at).toLocaleDateString()}</td><td><span className={"status "+(u.role==="admin"?"published":"draft")}>{u.role}</span></td><td><select className="role-select" value={u.role} onChange={e=>setRole(u,e.target.value)}><option value="student">Student</option><option value="admin">Admin</option></select></td></tr>)}</tbody></table></div></section></AdminFrame>;
}
