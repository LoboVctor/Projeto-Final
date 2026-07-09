import { ApiProperty } from '@nestjs/swagger';
import { IsNumber } from 'class-validator';

export class KpisTurmaResponseDto {
  @ApiProperty({ description: 'Média do score de comportamento diário' })
  @IsNumber()
  mediaComportamento!: number;

  @ApiProperty({ description: 'Média do score de interação social diária' })
  @IsNumber()
  mediaInteracao!: number;

  @ApiProperty({ description: 'Média do score de foco nas atividades' })
  @IsNumber()
  mediaFoco!: number;

  @ApiProperty({ description: 'Média do score de autonomia diária' })
  @IsNumber()
  mediaAutonomia!: number;

  @ApiProperty({ description: 'Média do status/score de alimentação' })
  @IsNumber()
  mediaAlimentacao!: number;

  @ApiProperty({ description: 'Média do status/score de uso do banheiro' })
  @IsNumber()
  mediaBanheiro!: number;
}