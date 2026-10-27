import { Controller, Get, NotFoundException, Param } from "@nestjs/common";
import { SupabaseService } from "./supabase.service";
@Controller("courses")
export class CoursesController {
 constructor(private readonly supabase: SupabaseService) {}
 @Get()
 async list() {
  const { data, error } = await this.supabase.db.from("courses").select("id,slug,title,description,price_minor,currency").eq("published", true).order("created_at", { ascending: false });
  if (error) throw new Error("Unable to load courses");
  return data ?? [];
 }
 @Get(":slug")
 async get(@Param("slug") slug: string) {
  const { data, error } = await this.supabase.db.from("courses").select("id,slug,title,description,price_minor,currency").eq("published", true).eq("slug", slug).maybeSingle();
  if (error) throw new Error("Unable to load course");
  if (!data) throw new NotFoundException("Course not found");
  return data;
 }
}
