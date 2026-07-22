import { IsEmail } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class EsqueceuSenhaDto {
  @ApiProperty({ example: 'professor@escola.elo' })
  @IsEmail({}, { message: 'E-mail inválido' })
  email!: string;
}
