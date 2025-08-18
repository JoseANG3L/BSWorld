import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Mapas } from './mapas';

describe('Mapas', () => {
  let component: Mapas;
  let fixture: ComponentFixture<Mapas>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Mapas]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Mapas);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
