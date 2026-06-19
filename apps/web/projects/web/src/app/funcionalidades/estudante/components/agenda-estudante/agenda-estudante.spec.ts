import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AgendaEstudante } from './agenda-estudante';

describe('AgendaEstudante', () => {
  let component: AgendaEstudante;
  let fixture: ComponentFixture<AgendaEstudante>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AgendaEstudante],
    }).compileComponents();

    fixture = TestBed.createComponent(AgendaEstudante);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
