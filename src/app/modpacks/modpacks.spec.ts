import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Modpacks } from './modpacks';

describe('Modpacks', () => {
  let component: Modpacks;
  let fixture: ComponentFixture<Modpacks>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Modpacks]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Modpacks);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
