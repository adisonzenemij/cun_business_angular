import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MdB52d40d1 } from './md-b52d40d1';

describe('MdB52d40d1', () => {
  let component: MdB52d40d1;
  let fixture: ComponentFixture<MdB52d40d1>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MdB52d40d1],
    }).compileComponents();

    fixture = TestBed.createComponent(MdB52d40d1);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
