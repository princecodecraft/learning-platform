import { NextRequest,NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { S3Client,PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { createClient } from "@supabase/supabase-js";
export const runtime="nodejs";
const allowed=new Set(["video/mp4","video/webm","video/quicktime","video/x-matroska"]);
export async function POST(request:NextRequest){
 try{
  const token=request.headers.get("authorization")?.replace(/^Bearer\s+/i,"");
  if(!token)return NextResponse.json({error:"Sign in as an administrator first."},{status:401});
  const {NEXT_PUBLIC_SUPABASE_URL:url,NEXT_PUBLIC_SUPABASE_ANON_KEY:anon,SUPABASE_SERVICE_ROLE_KEY:service,R2_ACCOUNT_ID:account,R2_ACCESS_KEY_ID:accessKey,R2_SECRET_ACCESS_KEY:secretKey,R2_BUCKET:bucket}=process.env;
  if(!url||!anon||!service||!account||!accessKey||!secretKey||!bucket)return NextResponse.json({error:"Video storage is not configured. Add the Supabase server credentials and Cloudflare R2 variables in Vercel."},{status:503});
  const authClient=createClient(url,anon);const{data:auth,error}=await authClient.auth.getUser(token);
  if(error||!auth.user)return NextResponse.json({error:"Your session expired."},{status:401});
  const admin=createClient(url,service,{auth:{persistSession:false,autoRefreshToken:false}});
  const{data:profile}=await admin.from("profiles").select("role").eq("id",auth.user.id).single();
  if(profile?.role!=="admin")return NextResponse.json({error:"Administrator access required."},{status:403});
  const body=await request.json();
  const name=typeof body.name==="string"?body.name:"";
  const contentType=typeof body.contentType==="string"?body.contentType:"";
  const size=Number(body.size);
  const courseId=typeof body.courseId==="string"?body.courseId:"";
  if(!name||name.length>240||!allowed.has(contentType)||!Number.isSafeInteger(size)||size<1||size>2*1024*1024*1024||!courseId)return NextResponse.json({error:"Choose an MP4, WebM, MOV or MKV video under 2 GB and a course."},{status:400});
  const{data:course}=await admin.from("courses").select("id").eq("id",courseId).single();
  if(!course)return NextResponse.json({error:"Course not found."},{status:404});
  const safeName=name.normalize("NFKD").replace(/[^a-zA-Z0-9._-]+/g,"-").slice(-120);
  const key="videos/"+courseId+"/"+randomUUID()+"-"+safeName;
  const s3=new S3Client({region:"auto",endpoint:"https://"+account+".r2.cloudflarestorage.com",credentials:{accessKeyId:accessKey,secretAccessKey:secretKey}});
  const command=new PutObjectCommand({Bucket:bucket,Key:key,ContentType:contentType,Metadata:{courseid:courseId,uploadedby:auth.user.id}});
  const uploadUrl=await getSignedUrl(s3,command,{expiresIn:600});
  return NextResponse.json({uploadUrl,key,videoRef:"r2://"+key,expiresIn:600});
 }catch{return NextResponse.json({error:"Could not prepare video upload."},{status:500});}
}
