import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MdD5fb87de } from './md-d5fb87de';

describe('MdD5fb87de', () => {
  let component: MdD5fb87de;
  let fixture: ComponentFixture<MdD5fb87de>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MdD5fb87de],
    }).compileComponents();

    fixture = TestBed.createComponent(MdD5fb87de);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
