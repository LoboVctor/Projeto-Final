import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateUserDto) {
    const saltRounds = 10;

    // Gera o hash a partir da senha em texto plano
    const hashedPassword = await bcrypt.hash(data.senha, saltRounds);

    // Guarda na base de dados com as conexões corretas do seu schema
    const newUser = await this.prisma.client.usuario.create({
      data: {
        email: data.email,
        senha: hashedPassword,
        role: 'PROFESSOR',
        educadorId: data.educadorId || null,
        responsavelId: data.responsavelId || null,
      },
    });

    // Remoção da senha do objeto de retorno por segurança
    const { senha, ...userWithoutPassword } = newUser;

    return userWithoutPassword;
  }

  async findByEmail(email: string) {
    return this.prisma.client.usuario.findUnique({
      where: { email },
    });
  }
}
