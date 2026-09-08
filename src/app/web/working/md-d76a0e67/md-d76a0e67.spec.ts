import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MdD76a0e67 } from './md-d76a0e67';

describe('MdD76a0e67', () => {
  let component: MdD76a0e67;
  let fixture: ComponentFixture<MdD76a0e67>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MdD76a0e67],
    }).compileComponents();

    fixture = TestBed.createComponent(MdD76a0e67);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
