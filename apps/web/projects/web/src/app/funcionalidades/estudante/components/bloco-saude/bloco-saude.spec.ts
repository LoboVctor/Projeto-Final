import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BlocoSaude } from './bloco-saude';

describe('BlocoSaude', () => {
  let component: BlocoSaude;
  let fixture: ComponentFixture<BlocoSaude>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BlocoSaude] }).compileComponents();

    fixture = TestBed.createComponent(BlocoSaude);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
