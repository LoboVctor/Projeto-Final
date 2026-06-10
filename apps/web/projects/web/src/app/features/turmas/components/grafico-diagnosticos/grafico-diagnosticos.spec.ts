import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GraficoDiagnosticos } from './grafico-diagnosticos';

describe('GraficoDiagnosticos', () => {
  let component: GraficoDiagnosticos;
  let fixture: ComponentFixture<GraficoDiagnosticos>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GraficoDiagnosticos],
    }).compileComponents();

    fixture = TestBed.createComponent(GraficoDiagnosticos);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
