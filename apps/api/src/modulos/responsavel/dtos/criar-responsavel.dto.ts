import { IsString, IsNotEmpty, IsEmail, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Sexo } from '@prisma-client';

export class CriarResponsavelDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  cpf!: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  nomeCompleto!: string;

  @ApiProperty({ enum: Sexo })
  @IsNotEmpty()
  @IsEnum(Sexo)
  sexo!: Sexo;

  @ApiProperty()
  @IsNotEmpty()
  @IsEmail()
  email!: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  telefone!: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  bairro!: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  endereco!: string;
}
