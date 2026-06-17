import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DashboardResponsavel } from './dashboard-responsavel';

describe('DashboardResponsavel', () => {
  let component: DashboardResponsavel;
  let fixture: ComponentFixture<DashboardResponsavel>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardResponsavel] }).compileComponents();

    fixture = TestBed.createComponent(DashboardResponsavel);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
