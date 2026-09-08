import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MdE144c860 } from './md-e144c860';

describe('MdE144c860', () => {
  let component: MdE144c860;
  let fixture: ComponentFixture<MdE144c860>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MdE144c860],
    }).compileComponents();

    fixture = TestBed.createComponent(MdE144c860);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
