import { ComponentFixture, TestBed } from '@angular/core/testing';
import { WgSidebar } from './wg-sidebar';

describe('WgSidebar', () => {
  let component: WgSidebar;
  let fixture: ComponentFixture<WgSidebar>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WgSidebar],
    }).compileComponents();

    fixture = TestBed.createComponent(WgSidebar);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
