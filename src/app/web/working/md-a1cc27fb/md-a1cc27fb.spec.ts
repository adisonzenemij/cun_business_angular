import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MdA1cc27fb } from './md-a1cc27fb';

describe('MdA1cc27fb', () => {
  let component: MdA1cc27fb;
  let fixture: ComponentFixture<MdA1cc27fb>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MdA1cc27fb],
    }).compileComponents();

    fixture = TestBed.createComponent(MdA1cc27fb);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
