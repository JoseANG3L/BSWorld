import { Routes } from '@angular/router';
import { Inicio } from './inicio/inicio';
import { AcercaDe } from './acerca-de/acerca-de';
import { Contacto } from './contacto/contacto';
import { Mapas } from './mapas/mapas';
import { Personajes } from './personajes/personajes';
import { Paquetes } from './paquetes/paquetes';
import { Modpacks } from './modpacks/modpacks';
import { Mods } from './mods/mods';
import { Minijuegos } from './minijuegos/minijuegos';
import { Perfil } from './perfil/perfil';

export const routes: Routes = [
    { path: '', component: Inicio },
    { path: 'mapas', component: Mapas },
    { path: 'minijuegos', component: Minijuegos },
    { path: 'mods', component: Mods },
    { path: 'modpacks', component: Modpacks },
    { path: 'paquetes', component: Paquetes },
    { path: 'personajes', component: Personajes },
    
    { path: 'perfil', component: Perfil },
    
    { path: 'acerca-de', component: AcercaDe },
    { path: 'contacto', component: Contacto },
    { path: '**', redirectTo: '' }
];
