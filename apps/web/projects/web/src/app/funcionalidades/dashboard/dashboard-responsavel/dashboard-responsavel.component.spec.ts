import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { API_BASE_URL } from '../../../nucleo/config/api.config';

import { DashboardResponsavelComponent } from './dashboard-responsavel.component';

describe('DashboardResponsavelComponent', () => {
  let component: DashboardResponsavelComponent;
  let fixture: ComponentFixture<DashboardResponsavelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardResponsavelComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: API_BASE_URL, useValue: 'http://localhost:3000/api/v1' },
      ]
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
