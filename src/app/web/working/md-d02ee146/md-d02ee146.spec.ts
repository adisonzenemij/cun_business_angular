import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MdD02ee146 } from './md-d02ee146';

describe('MdD02ee146', () => {
  let component: MdD02ee146;
  let fixture: ComponentFixture<MdD02ee146>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MdD02ee146],
    }).compileComponents();

    fixture = TestBed.createComponent(MdD02ee146);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
