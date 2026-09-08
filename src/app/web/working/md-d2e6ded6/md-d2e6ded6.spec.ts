import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MdD2e6ded6 } from './md-d2e6ded6';

describe('MdD2e6ded6', () => {
  let component: MdD2e6ded6;
  let fixture: ComponentFixture<MdD2e6ded6>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MdD2e6ded6],
    }).compileComponents();

    fixture = TestBed.createComponent(MdD2e6ded6);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
