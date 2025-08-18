import { Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-header',
  imports: [RouterModule],
  templateUrl: './header.html',
  styleUrl: './header.css'
})
export class Header {
  theme: 'light' | 'dark' = 'light';

  constructor() {
    const saved = localStorage.getItem('theme') as 'light' | 'dark' | null;
    this.theme = saved ?? 'light';
    document.documentElement.setAttribute('data-bs-theme', this.theme);
  }

  toggleTheme() {
    this.theme = this.theme === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-bs-theme', this.theme);
    localStorage.setItem('theme', this.theme);
  }
}
