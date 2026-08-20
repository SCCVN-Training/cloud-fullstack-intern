import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AppStore } from './core/app/data-access/with-app-store';
import { Footer } from './shared/components/footer/footer';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Footer],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  readonly appStore = inject(AppStore);

  // constructor() {
  //   inject(AppEvent).initializeAppAsync();
  // }
}
