import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PtNavbar } from './pt-navbar';

describe('PtNavbar', () => {
  let component: PtNavbar;
  let fixture: ComponentFixture<PtNavbar>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PtNavbar],
    }).compileComponents();

    fixture = TestBed.createComponent(PtNavbar);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
