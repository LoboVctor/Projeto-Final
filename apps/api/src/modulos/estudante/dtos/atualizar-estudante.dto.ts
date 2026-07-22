import { IsString, IsNotEmpty, IsEnum, IsDateString, IsOptional, IsEmail } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Sexo, Fcom } from '@prisma-client';

export class AtualizarEstudanteDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  matricula?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  nomeCompleto?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  dataNascimento?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  cpf?: string;

  @ApiPropertyOptional({ enum: Sexo })
  @IsOptional()
  @IsEnum(Sexo)
  sexo?: Sexo;

  @ApiPropertyOptional({ enum: Fcom })
  @IsOptional()
  @IsEnum(Fcom)
  formaComunicacao?: Fcom;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  turmaId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  nomeResponsavel?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  telefoneResponsavel?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
  emailResponsavel?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  enderecoResponsavel?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  cpfResponsavel?: string;
}
