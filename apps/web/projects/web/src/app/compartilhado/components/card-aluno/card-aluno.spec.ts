import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CardAlunoComponent } from './card-aluno';

describe('CardAluno', () => {
  let component: CardAlunoComponent;
  let fixture: ComponentFixture<CardAlunoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CardAlunoComponent] }).compileComponents();

    fixture = TestBed.createComponent(CardAlunoComponent);
    fixture.componentRef.setInput('nome', 'Aluno Teste');
    fixture.componentRef.setInput('diagnostico', 'TEA');
    fixture.componentRef.setInput('matricula', 123);
    fixture.componentRef.setInput('estudante', { nomeCompleto: 'Aluno Teste', dataNascimento: '2015-01-01' });
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
