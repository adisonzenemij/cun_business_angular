import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MdA6aedeb5 } from './md-a6aedeb5';

describe('MdA6aedeb5', () => {
  let component: MdA6aedeb5;
  let fixture: ComponentFixture<MdA6aedeb5>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MdA6aedeb5],
    }).compileComponents();

    fixture = TestBed.createComponent(MdA6aedeb5);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
