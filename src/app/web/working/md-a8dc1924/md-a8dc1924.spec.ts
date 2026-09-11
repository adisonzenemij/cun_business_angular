import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MdA8dc1924 } from './md-a8dc1924';

describe('MdA8dc1924', () => {
  let component: MdA8dc1924;
  let fixture: ComponentFixture<MdA8dc1924>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MdA8dc1924],
    }).compileComponents();

    fixture = TestBed.createComponent(MdA8dc1924);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
