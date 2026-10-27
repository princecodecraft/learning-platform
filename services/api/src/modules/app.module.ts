import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { HealthController } from "./health.controller";
import { CoursesController } from "./courses.controller";
import { SupabaseService } from "./supabase.service";
@Module({ imports: [ConfigModule.forRoot({ isGlobal: true })], controllers: [HealthController, CoursesController], providers: [SupabaseService] })
export class AppModule {}
