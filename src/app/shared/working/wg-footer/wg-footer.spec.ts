import { ComponentFixture, TestBed } from '@angular/core/testing';
import { WgFooter } from './wg-footer';

describe('WgFooter', () => {
  let component: WgFooter;
  let fixture: ComponentFixture<WgFooter>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WgFooter],
    }).compileComponents();

    fixture = TestBed.createComponent(WgFooter);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
