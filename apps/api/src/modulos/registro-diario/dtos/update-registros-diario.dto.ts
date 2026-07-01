import { PartialType } from '@nestjs/swagger';
import { CreateRegistrosDiarioDto } from './create-registros-diario.dto';

export class UpdateRegistrosDiarioDto extends PartialType(
  CreateRegistrosDiarioDto,
) {}
