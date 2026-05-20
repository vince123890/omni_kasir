import { NestFactory } from '@nestjs/core'
import { ValidationPipe } from '@nestjs/common'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import { AppModule } from './app.module'
import { HttpExceptionFilter } from './common/filters/http-exception.filter'
import { ResponseInterceptor } from './common/interceptors/response.interceptor'

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log'],
  })

  app.setGlobalPrefix('api')

  // CORS — terima semua origin di production, bisa diperketat nanti
  const frontendUrl = process.env.FRONTEND_URL
  app.enableCors({
    origin: frontendUrl ? [frontendUrl, 'http://localhost:5173'] : true,
    credentials: true,
  })

  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    transform: true,
    forbidNonWhitelisted: true,
  }))

  app.useGlobalFilters(new HttpExceptionFilter())
  app.useGlobalInterceptors(new ResponseInterceptor())

  // Swagger hanya di non-production
  if (process.env.NODE_ENV !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('Omni Kasir API')
      .setDescription('API documentation untuk aplikasi kasir multi-tenant')
      .setVersion('1.0')
      .addBearerAuth()
      .build()
    const document = SwaggerModule.createDocument(app, config)
    SwaggerModule.setup('docs', app, document)
  }

  // Hostinger inject PORT via env — wajib pakai ini
  const port = parseInt(process.env.PORT || '3000', 10)

  // Listen di 0.0.0.0 bukan localhost — wajib untuk hosting
  await app.listen(port, '0.0.0.0')
  console.log(`Server running on port ${port}`)
}

bootstrap().catch((err) => {
  console.error('Fatal error during bootstrap:', err)
  process.exit(1)
})
