import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from "@nestjs/common";
import { randomUUID } from "crypto";
import { Observable } from "rxjs";

// P1 funnel: request-id para logs/métricas/trazas.
@Injectable()
export class RequestIdInterceptor implements NestInterceptor {
  intercept(ctx: ExecutionContext, next: CallHandler): Observable<unknown> {
    const res = ctx.switchToHttp().getResponse();
    const req = ctx.switchToHttp().getRequest();
    req.requestId = req.headers["x-request-id"] ?? randomUUID();
    res.setHeader("x-request-id", req.requestId);
    return next.handle();
  }
}
