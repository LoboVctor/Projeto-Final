import { TestBed } from '@angular/core/testing';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { API_BASE_URL } from '../config/api.config';
import { AuthService } from './auth';

// CR-09: corrigido import — a classe exportada é AuthService, não Auth
describe('AuthService', () => {
  let service: AuthService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: API_BASE_URL, useValue: 'http://localhost:3000/api/v1' },
      ] });
    service = TestBed.inject(AuthService);
  });

  it('deve ser criado', () => {
    expect(service).toBeTruthy();
  });

  it('deve retornar null para usuário não autenticado', () => {
    expect(service.getLoggedUserId()).toBeNull();
  });

  it('deve retornar false para isAuthenticated sem token', () => {
    expect(service.isAuthenticated()).toBeFalsy();
  });
});
