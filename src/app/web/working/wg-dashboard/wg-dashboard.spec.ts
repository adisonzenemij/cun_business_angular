import { ComponentFixture, TestBed } from '@angular/core/testing';
import { WgDashboard } from './wg-dashboard';

describe('WgDashboard', () => {
  let component: WgDashboard;
  let fixture: ComponentFixture<WgDashboard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WgDashboard],
    }).compileComponents();

    fixture = TestBed.createComponent(WgDashboard);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
