import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Mods } from './mods';

describe('Mods', () => {
  let component: Mods;
  let fixture: ComponentFixture<Mods>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Mods]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Mods);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
