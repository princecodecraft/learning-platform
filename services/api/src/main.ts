import "reflect-metadata";
import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { ConfigService } from "@nestjs/config";
import { AppModule } from "./modules/app.module";
async function bootstrap() {
 const app = await NestFactory.create(AppModule);
 const config = app.get(ConfigService);
 const origins = (config.get<string>("CORS_ORIGINS") ?? "http://localhost:3000,http://localhost:3001").split(",").map(v => v.trim());
 app.enableCors({ origin: origins, credentials: true });
 app.setGlobalPrefix("api/v1");
 app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: true }));
 await app.listen(Number(config.get("PORT") ?? 4000), "0.0.0.0");
}
bootstrap();
