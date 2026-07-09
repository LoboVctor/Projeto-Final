import { Injectable } from '@nestjs/common';
import { EducadorRepository, FiltrosEducador, AtualizarEducadorDados } from './educador.repository.js';

@Injectable()
export class EducadorService {
  constructor(private readonly educadorRepository: EducadorRepository) {}

  listar(filtros: FiltrosEducador) {
    return this.educadorRepository.listar(filtros);
  }

  buscarPorId(id: string) {
    return this.educadorRepository.buscarPorId(id);
  }

  atualizar(id: string, dados: AtualizarEducadorDados) {
    return this.educadorRepository.atualizar(id, dados);
  }

  desativar(id: string) {
    return this.educadorRepository.desativar(id);
  }

  reativar(id: string) {
    return this.educadorRepository.reativar(id);
  }
}
