import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Personajes } from './personajes';

describe('Personajes', () => {
  let component: Personajes;
  let fixture: ComponentFixture<Personajes>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Personajes]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Personajes);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
