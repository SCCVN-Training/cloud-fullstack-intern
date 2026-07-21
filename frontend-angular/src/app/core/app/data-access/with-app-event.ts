import { Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { AppEffect } from './with-app-effect';

@Injectable({
  providedIn: 'root',
})
export class AppEvent {
  constructor(private readonly effect: AppEffect) {}

  initializeApp() {
    console.log('[App Event] Initialization triggered');
    return this.effect.initializeApp().subscribe();
  }

  initializeAppAsync(): Promise<void> {
    console.log('[App Event] Initialization (async) triggered');
    return firstValueFrom(this.effect.initializeApp());
  }
}
