import { IsNotEmpty, IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class UpdateMetaDescricaoDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  @MaxLength(80)
  @Matches(/^(?!\s+$)(?!\d+$)(?!-+$)/, { message: 'Descrição não pode conter apenas espaços, números ou hífens' })
  descricao!: string;
}
