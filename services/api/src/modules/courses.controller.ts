import { Controller, Get, NotFoundException, Param } from "@nestjs/common";
// Temporary sample data; replace with repository-backed database queries before production.
const courses = [
 { id: "web-foundations", slug: "web-foundations", title: "Modern Web Development", description: "Build accessible, responsive web experiences.", level: "beginner", published: true },
 { id: "backend-engineering", slug: "backend-engineering", title: "Backend Engineering", description: "Design maintainable APIs and data models.", level: "intermediate", published: true },
 { id: "practical-ai", slug: "practical-ai", title: "Practical AI Applications", description: "Build retrieval-powered features and evaluate outputs.", level: "intermediate", published: true }
];
@Controller("courses")
export class CoursesController {
 @Get()
 list() { return courses.filter(course => course.published); }
 @Get(":slug")
 get(@Param("slug") slug: string) {
  const course = courses.find(item => item.slug === slug && item.published);
  if (!course) throw new NotFoundException("Course not found");
  return course;
 }
}
