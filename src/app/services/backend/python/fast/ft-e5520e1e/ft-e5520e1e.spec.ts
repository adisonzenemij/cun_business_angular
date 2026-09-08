import { TestBed } from '@angular/core/testing';
import { FtE5520e1e } from './ft-e5520e1e';

describe('FtE5520e1e', () => {
  let service: FtE5520e1e;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(FtE5520e1e);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
