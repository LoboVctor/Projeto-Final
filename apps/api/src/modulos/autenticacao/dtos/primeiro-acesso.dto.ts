import { IsString, MinLength, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class PrimeiroAcessoDto {
  @ApiProperty({ example: 'NovaSenha@123', minLength: 8 })
  @IsString()
  @MinLength(8, { message: 'A senha deve ter pelo menos 8 caracteres' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()\-_=+\[\]{};:'",.<>\/?\\|`~]).+$/, {
    message: 'A senha deve conter letra maiúscula, minúscula, número e caractere especial',
  })
  novaSenha!: string;
}
