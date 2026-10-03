import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { configureApp, setupSwagger } from "./app.setup";

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  const port = Number(process.env.API_PORT ?? 4000);

  configureApp(app);
  setupSwagger(app);

  await app.listen(port);
}

void bootstrap();
