import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Minijuegos } from './minijuegos';

describe('Minijuegos', () => {
  let component: Minijuegos;
  let fixture: ComponentFixture<Minijuegos>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Minijuegos]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Minijuegos);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
