import { ArgumentMetadata, BadRequestException, Injectable, PipeTransform } from "@nestjs/common";
import type { ZodSchema } from "zod";

// P3 funnel: validación estricta 400/422, bloquea campos extra (mass assignment).
@Injectable()
export class ZodPipe implements PipeTransform {
  constructor(private schema: ZodSchema) {}
  transform(value: unknown, _meta: ArgumentMetadata) {
    const parsed = this.schema.safeParse(value ?? {});
    if (!parsed.success) {
      throw new BadRequestException({ message: "validation failed", issues: parsed.error.issues });
    }
    return parsed.data;
  }
}
