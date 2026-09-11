import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MdD8d07776 } from './md-d8d07776';

describe('MdD8d07776', () => {
  let component: MdD8d07776;
  let fixture: ComponentFixture<MdD8d07776>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MdD8d07776],
    }).compileComponents();

    fixture = TestBed.createComponent(MdD8d07776);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
