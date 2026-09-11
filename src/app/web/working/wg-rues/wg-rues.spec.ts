import { ComponentFixture, TestBed } from '@angular/core/testing';
import { WgRues } from './wg-rues';

describe('WgRues', () => {
  let component: WgRues;
  let fixture: ComponentFixture<WgRues>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WgRues],
    }).compileComponents();

    fixture = TestBed.createComponent(WgRues);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
