import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MdA1fecd50 } from './md-a1fecd50';

describe('MdA1fecd50', () => {
  let component: MdA1fecd50;
  let fixture: ComponentFixture<MdA1fecd50>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MdA1fecd50],
    }).compileComponents();

    fixture = TestBed.createComponent(MdA1fecd50);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
