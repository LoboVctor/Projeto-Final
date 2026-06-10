import { TestBed } from '@angular/core/testing';

import { Turmas } from './turmas';

describe('Turmas', () => {
  let service: Turmas;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Turmas);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
