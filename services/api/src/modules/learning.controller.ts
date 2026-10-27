import { Controller, Get, Req, UseGuards } from "@nestjs/common";
import { SupabaseService } from "./supabase.service";
import { SupabaseAuthGuard } from "./supabase-auth.guard";
@Controller("me")
@UseGuards(SupabaseAuthGuard)
export class LearningController {
 constructor(private readonly supabase: SupabaseService) {}
 @Get("enrollments")
 async enrollments(@Req() req: any) {
  const { data, error } = await this.supabase.db.from("enrollments").select("id,status,enrolled_at,courses(id,slug,title,description)").eq("user_id", req.user.id).order("enrolled_at", { ascending: false });
  if (error) throw new Error("Unable to load enrollments");
  return data ?? [];
 }
 @Get("progress")
 async progress(@Req() req: any) {
  const { data, error } = await this.supabase.db.from("lesson_progress").select("id,lesson_id,completed_at,updated_at").eq("user_id", req.user.id).order("updated_at", { ascending: false });
  if (error) throw new Error("Unable to load learning progress");
  return data ?? [];
 }
}
