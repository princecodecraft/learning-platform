import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { HealthController } from "./health.controller";
import { CoursesController } from "./courses.controller";
@Module({ imports: [ConfigModule.forRoot({ isGlobal: true })], controllers: [HealthController, CoursesController] })
export class AppModule {}
