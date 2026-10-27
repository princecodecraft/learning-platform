import { NextRequest,NextResponse } from "next/server";
import { GetObjectCommand,S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { createClient } from "@supabase/supabase-js";
export const runtime="nodejs";
export async function GET(request:NextRequest,{params}:{params:{lessonId:string}}){
 try{
  const token=request.headers.get("authorization")?.replace(/^Bearer\s+/i,"");
  if(!token)return NextResponse.json({error:"Sign in to play this lesson."},{status:401});
  const {NEXT_PUBLIC_SUPABASE_URL:url,NEXT_PUBLIC_SUPABASE_ANON_KEY:anon,SUPABASE_SERVICE_ROLE_KEY:service,R2_ACCOUNT_ID:account,R2_ACCESS_KEY_ID:accessKey,R2_SECRET_ACCESS_KEY:secretKey,R2_BUCKET:bucket}=process.env;
  if(!url||!anon||!service)return NextResponse.json({error:"Lesson access is not configured."},{status:503});
  const authClient=createClient(url,anon);const{data:auth,error}=await authClient.auth.getUser(token);
  if(error||!auth.user)return NextResponse.json({error:"Your session expired."},{status:401});
  const admin=createClient(url,service,{auth:{persistSession:false,autoRefreshToken:false}});
  const{data:lesson}=await admin.from("lessons").select("id,course_id,video_url,is_preview,courses!inner(id,published)").eq("id",params.lessonId).single();
  if(!lesson)return NextResponse.json({error:"Lesson not found."},{status:404});
  const course=Array.isArray(lesson.courses)?lesson.courses[0]:lesson.courses;
  if(!course?.published)return NextResponse.json({error:"This course is not published."},{status:404});
  const{data:profile}=await admin.from("profiles").select("role").eq("id",auth.user.id).single();
  const isAdmin=profile?.role==="admin";
  if(!lesson.is_preview&&!isAdmin){const{data:enrollment}=await admin.from("enrollments").select("id").eq("user_id",auth.user.id).eq("course_id",lesson.course_id).eq("status","active").maybeSingle();if(!enrollment)return NextResponse.json({error:"Purchase or enroll in this course to watch this lesson."},{status:403});}
  if(!lesson.video_url)return NextResponse.json({error:"Video has not been added yet."},{status:404});
  if(!lesson.video_url.startsWith("r2://")){const external=lesson.video_url;if(!/^https:\/\//i.test(external))return NextResponse.json({error:"Invalid video URL."},{status:400});return NextResponse.json({url:external,expiresIn:null});}
  if(!account||!accessKey||!secretKey||!bucket)return NextResponse.json({error:"Cloudflare R2 playback is not configured."},{status:503});
  const key=lesson.video_url.slice(5);
  if(!key.startsWith("videos/"+lesson.course_id+"/"))return NextResponse.json({error:"Invalid video object reference."},{status:400});
  const s3=new S3Client({region:"auto",endpoint:"https://"+account+".r2.cloudflarestorage.com",credentials:{accessKeyId:accessKey,secretAccessKey:secretKey}});
  const urlSigned=await getSignedUrl(s3,new GetObjectCommand({Bucket:bucket,Key:key}),{expiresIn:300});
  return NextResponse.json({url:urlSigned,expiresIn:300});
 }catch{return NextResponse.json({error:"Could not authorize lesson playback."},{status:500});}
}
