import { IsString, IsNotEmpty, IsEnum, IsDateString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Sexo, Fcom } from '@prisma-client';

export class CriarEstudanteDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  matricula!: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  nomeCompleto!: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsDateString()
  dataNascimento!: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  cpf!: string;

  @ApiProperty({ enum: Sexo })
  @IsNotEmpty()
  @IsEnum(Sexo)
  sexo!: Sexo;

  @ApiProperty({ enum: Fcom })
  @IsNotEmpty()
  @IsEnum(Fcom)
  formaComunicacao!: Fcom;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  turmaId?: string;
}
