import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { API_BASE_URL } from '../../../../nucleo/config/api.config';

import { GraficoDiagnosticosComponent } from './grafico-diagnosticos';

describe('GraficoDiagnosticos', () => {
  let component: GraficoDiagnosticosComponent;
  let fixture: ComponentFixture<GraficoDiagnosticosComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GraficoDiagnosticosComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: API_BASE_URL, useValue: 'http://localhost:3000/api/v1' },
      ] }).compileComponents();

    fixture = TestBed.createComponent(GraficoDiagnosticosComponent);
    fixture.componentRef.setInput('turmaId', 'turma-teste-id');
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
