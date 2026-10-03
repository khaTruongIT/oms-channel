import { ValidationPipe, type INestApplication } from "@nestjs/common";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import helmet from "helmet";

export function configureApp(app: INestApplication): INestApplication {
  app.setGlobalPrefix("api/v1");
  app.enableCors({
    origin: process.env.WEB_ORIGIN?.split(",") ?? ["http://localhost:3000"],
  });
  app.use(helmet());
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  return app;
}

export function setupSwagger(app: INestApplication): void {
  const config = new DocumentBuilder()
    .setTitle("OPTIQIS API")
    .setDescription(
      "REST API for OPTIQIS optical education, product catalog, O2O clinic locator, and demo CMS workflows.",
    )
    .setVersion("0.1.0")
    .addBearerAuth(
      {
        type: "http",
        scheme: "bearer",
        bearerFormat: "OPTIQIS demo token",
        description: "Use the token returned by /api/v1/auth/login for demo admin endpoints.",
      },
      "demo-bearer",
    )
    .addTag("auth", "Demo CMS authentication and user identity")
    .addTag("products", "Public and CMS optical lens product APIs")
    .addTag("articles", "Public knowledge hub and CMS article workflow APIs")
    .addTag("clinics", "O2O clinic locator APIs")
    .addTag("leads", "Public consultation capture and protected lead triage APIs")
    .addTag("oms", "Protected OMS adapter status and integration diagnostics")
    .addTag("seo", "Deterministic SEO scoring helper")
    .build();

  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("docs", app, documentFactory, {
    customSiteTitle: "OPTIQIS API Docs",
  });
}
