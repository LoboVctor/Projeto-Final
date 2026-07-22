import { TestBed } from '@angular/core/testing';
import { DiagnosticoVisibilidadeService } from './diagnostico-visibilidade.service';

describe('DiagnosticoVisibilidadeService', () => {
  let service: DiagnosticoVisibilidadeService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DiagnosticoVisibilidadeService);
  });

  it('inicia visível (feature desativada)', () => {
    expect(service.visivel()).toBe(true);
  });

  it('alternar() inverte o estado', () => {
    service.alternar();
    expect(service.visivel()).toBe(false);

    service.alternar();
    expect(service.visivel()).toBe(true);
  });
});
