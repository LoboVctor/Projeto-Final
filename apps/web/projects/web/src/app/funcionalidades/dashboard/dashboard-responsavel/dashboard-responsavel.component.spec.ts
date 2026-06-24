import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DashboardResponsavelComponent } from './dashboard-responsavel.component';

describe('DashboardResponsavelComponent', () => {
  let component: DashboardResponsavelComponent;
  let fixture: ComponentFixture<DashboardResponsavelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardResponsavelComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DashboardResponsavelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
