import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MdE9cb64fd } from './md-e9cb64fd';

describe('MdE9cb64fd', () => {
  let component: MdE9cb64fd;
  let fixture: ComponentFixture<MdE9cb64fd>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MdE9cb64fd],
    }).compileComponents();

    fixture = TestBed.createComponent(MdE9cb64fd);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
