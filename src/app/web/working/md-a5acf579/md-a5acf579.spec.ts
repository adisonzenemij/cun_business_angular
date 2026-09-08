import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MdA5acf579 } from './md-a5acf579';

describe('MdA5acf579', () => {
  let component: MdA5acf579;
  let fixture: ComponentFixture<MdA5acf579>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MdA5acf579],
    }).compileComponents();

    fixture = TestBed.createComponent(MdA5acf579);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
