import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BlocoSaudeComponent } from './bloco-saude.component';

describe('BlocoSaude', () => {
  let component: BlocoSaudeComponent;
  let fixture: ComponentFixture<BlocoSaudeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BlocoSaudeComponent] }).compileComponents();

    fixture = TestBed.createComponent(BlocoSaudeComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
