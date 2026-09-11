import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MdB602ef28 } from './md-b602ef28';

describe('MdB602ef28', () => {
  let component: MdB602ef28;
  let fixture: ComponentFixture<MdB602ef28>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MdB602ef28],
    }).compileComponents();

    fixture = TestBed.createComponent(MdB602ef28);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
