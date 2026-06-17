import { TestBed } from '@angular/core/testing';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { API_BASE_URL } from '../../nucleo/config/api.config';
import { TurmasService } from '../../nucleo/services/turmas.service';

// CR-09: corrigido import — a classe exportada é TurmasService, movida para core/services
describe('TurmasService', () => {
  let service: TurmasService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: 'http://localhost:3000/api/v1' },
      ] });
    service = TestBed.inject(TurmasService);
  });

  it('deve ser criado', () => {
    expect(service).toBeTruthy();
  });
});
