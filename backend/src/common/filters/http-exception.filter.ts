import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common'

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp()
    const response = ctx.getResponse()

    const status = exception instanceof HttpException
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR

    const exResponse = exception instanceof HttpException
      ? exception.getResponse()
      : { message: 'Internal server error' }

    const message = typeof exResponse === 'object' && 'message' in (exResponse as object)
      ? (exResponse as { message: string | string[] }).message
      : exResponse

    response.status(status).json({
      statusCode: status,
      message: Array.isArray(message) ? message[0] : message,
      errors: Array.isArray(message) ? message : undefined,
    })
  }
}
