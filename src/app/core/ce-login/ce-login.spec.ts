import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CeLogin } from './ce-login';

describe('CeLogin', () => {
  let component: CeLogin;
  let fixture: ComponentFixture<CeLogin>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CeLogin],
    }).compileComponents();

    fixture = TestBed.createComponent(CeLogin);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
