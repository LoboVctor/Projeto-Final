import { Type } from 'class-transformer';
import { IsArray, IsNotEmpty, IsString, IsUUID, Matches, MaxLength, MinLength, ValidateNested } from 'class-validator';

export class UpdateMetaDescricaoItemDto {
  @IsUUID()
  @IsNotEmpty()
  id!: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  @MaxLength(80)
  @Matches(/^(?!\s+$)(?!\d+$)(?!-+$)/, { message: 'Descrição não pode conter apenas espaços, números ou hífens' })
  descricao!: string;
}

export class UpdateMetasLoteDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateMetaDescricaoItemDto)
  metas!: UpdateMetaDescricaoItemDto[];
}
