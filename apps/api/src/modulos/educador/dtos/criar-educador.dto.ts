import { IsString, IsNotEmpty, IsEmail, IsArray, IsDateString, IsEnum, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TipoEducador } from '@prisma-client';

export class CriarEducadorDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  nome!: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  matricula!: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  cpf!: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsEmail()
  email!: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  telefone!: string;

  @ApiProperty({ enum: TipoEducador })
  @IsNotEmpty()
  @IsEnum(TipoEducador)
  tipo!: TipoEducador;

  @ApiProperty()
  @IsNotEmpty()
  @IsDateString()
  dataContratacao!: string;

  @ApiPropertyOptional({ type: [String], description: 'IDs das turmas associadas ao educador' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  turmaIds?: string[];
}
