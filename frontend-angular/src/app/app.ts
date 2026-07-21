import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AppStore } from './core/app/data-access/with-app-store';
import { FooterComponent } from './shared/components/footer/footer.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, FooterComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  readonly appStore = inject(AppStore);

  // constructor() {
  //   inject(AppEvent).initializeApp();
  // }
}
