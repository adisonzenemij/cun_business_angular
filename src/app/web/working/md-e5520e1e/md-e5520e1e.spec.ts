import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MdE5520e1e } from './md-e5520e1e';

describe('MdE5520e1e', () => {
  let component: MdE5520e1e;
  let fixture: ComponentFixture<MdE5520e1e>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MdE5520e1e],
    }).compileComponents();

    fixture = TestBed.createComponent(MdE5520e1e);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
