import { ComponentFixture, TestBed } from '@angular/core/testing';
import { WgReport } from './wg-report';

describe('WgReport', () => {
  let component: WgReport;
  let fixture: ComponentFixture<WgReport>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WgReport],
    }).compileComponents();

    fixture = TestBed.createComponent(WgReport);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
