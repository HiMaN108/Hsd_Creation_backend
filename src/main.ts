import { NestFactory, Reflector } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { join } from 'path';
import {
  BadRequestException,
  ValidationPipe,
  ClassSerializerInterceptor,
} from '@nestjs/common';
import { HttpExceptionFilter } from './common/exception/http.exception';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { useContainer } from 'class-validator';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Serve static assets from the "assets" directory
  app.useStaticAssets(join(__dirname, '..', 'assets'), {
    prefix: '/assets/',
  });

  app.setGlobalPrefix('api');

  /*
   * Enable DI for class-validator
   */
  useContainer(app.select(AppModule), { fallbackOnErrors: true });

  /*
   * Validation
   */
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      exceptionFactory: (errors) => {
        const firstError = errors[0]?.constraints
          ? Object.values(errors[0].constraints)[0]
          : 'Validation failed';

        return new BadRequestException(firstError);
      },
    }),
  );

  /*
   * IMPORTANT: Enable @Exclude() / @Expose()
   */
  app.useGlobalInterceptors(
    new ClassSerializerInterceptor(app.get(Reflector)),
    new ResponseInterceptor(),
  );

  /*
   * Exception handling
   */
  app.useGlobalFilters(new HttpExceptionFilter());

  /*
   * Swagger setup
   */
  const config = new DocumentBuilder()
    .setTitle('Employee Management API')
    .setDescription('API description')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT', // optional, just for display
        description: 'Enter JWT token obtained from login',
      },
      'bearerAuth', // This name must match @ApiBearerAuth('bearerAuth')
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document);

  await app.listen(process.env.PORT ?? 3000, () => {
    console.log('server connected');
  });
}
bootstrap().catch((err) => {
  console.error('Error during bootstrap:', err);
});
