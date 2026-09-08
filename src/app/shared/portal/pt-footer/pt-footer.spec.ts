import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PtFooter } from './pt-footer';

describe('PtFooter', () => {
  let component: PtFooter;
  let fixture: ComponentFixture<PtFooter>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PtFooter],
    }).compileComponents();

    fixture = TestBed.createComponent(PtFooter);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
