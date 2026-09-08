import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MdA7b95fe8 } from './md-a7b95fe8';

describe('MdA7b95fe8', () => {
  let component: MdA7b95fe8;
  let fixture: ComponentFixture<MdA7b95fe8>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MdA7b95fe8],
    }).compileComponents();

    fixture = TestBed.createComponent(MdA7b95fe8);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
