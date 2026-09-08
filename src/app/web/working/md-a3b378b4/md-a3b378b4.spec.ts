import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MdA3b378b4 } from './md-a3b378b4';

describe('MdA3b378b4', () => {
  let component: MdA3b378b4;
  let fixture: ComponentFixture<MdA3b378b4>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MdA3b378b4],
    }).compileComponents();

    fixture = TestBed.createComponent(MdA3b378b4);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
