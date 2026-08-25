import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { AppEffect } from './with-app-effect';

@Injectable({
  providedIn: 'root',
})
export class AppEvent {
  private readonly effect = inject(AppEffect);

  initializeApp() {
    console.log('[App Event] Initialization triggered');
    return this.effect.initializeApp().subscribe();
  }

  initializeAppAsync(): Promise<void> {
    console.log('[App Event] Initialization (async) triggered');
    // return firstValueFrom(this.effect.initializeApp());
    return firstValueFrom(this.effect.initializeAppWithoutHealth());
  }
}
