import { ComponentFixture, TestBed } from '@angular/core/testing';
import { WgSociety } from './wg-society';

describe('WgSociety', () => {
  let component: WgSociety;
  let fixture: ComponentFixture<WgSociety>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WgSociety],
    }).compileComponents();

    fixture = TestBed.createComponent(WgSociety);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
