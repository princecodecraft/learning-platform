import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HealthController } from './health.controller';
import { CoursesController } from './courses.controller';
import { LearningController } from './learning.controller';
import { SupabaseService } from './supabase.service';
import { SupabaseAuthGuard } from './supabase-auth.guard';
@Module({ imports: [ConfigModule.forRoot({ isGlobal: true })], controllers: [HealthController, CoursesController, LearningController], providers: [SupabaseService, SupabaseAuthGuard] })
export class AppModule {}
