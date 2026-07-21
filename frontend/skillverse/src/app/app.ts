import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ToastComponent } from './shared/components/toast/toast.component';

@Component({
  selector: 'app-root',
  imports: [
    RouterOutlet,
    ToastComponent
  ],
  template: `
    <router-outlet></router-outlet>
    <app-toast></app-toast>
  `,
  styleUrl: './app.scss'
})
export class App {
  protected readonly title = signal('skillverse');
}
