import { ComponentFixture, TestBed } from '@angular/core/testing';
import { WgNavbar } from './wg-navbar';

describe('WgNavbar', () => {
  let component: WgNavbar;
  let fixture: ComponentFixture<WgNavbar>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WgNavbar],
    }).compileComponents();

    fixture = TestBed.createComponent(WgNavbar);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
