import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MdB64883b6 } from './md-b64883b6';

describe('MdB64883b6', () => {
  let component: MdB64883b6;
  let fixture: ComponentFixture<MdB64883b6>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MdB64883b6],
    }).compileComponents();

    fixture = TestBed.createComponent(MdB64883b6);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
