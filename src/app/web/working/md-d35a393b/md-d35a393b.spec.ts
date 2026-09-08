import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MdD35a393b } from './md-d35a393b';

describe('MdD35a393b', () => {
  let component: MdD35a393b;
  let fixture: ComponentFixture<MdD35a393b>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MdD35a393b],
    }).compileComponents();

    fixture = TestBed.createComponent(MdD35a393b);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
