import { ComponentFixture, TestBed } from '@angular/core/testing';
import { WgModule } from './wg-module';

describe('WgModule', () => {
  let component: WgModule;
  let fixture: ComponentFixture<WgModule>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WgModule],
    }).compileComponents();

    fixture = TestBed.createComponent(WgModule);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
