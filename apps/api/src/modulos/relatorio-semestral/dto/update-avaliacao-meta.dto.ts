import { IsString, IsInt, IsOptional, Min, Max } from 'class-validator';

export class UpdateAvaliacaoMetaDto {
  @IsInt()
  @Min(0)
  @Max(5)
  scoreFinal!: number;

  @IsString()
  @IsOptional()
  parecer?: string;
}
