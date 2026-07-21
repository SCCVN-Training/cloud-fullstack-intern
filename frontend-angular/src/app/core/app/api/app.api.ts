import { Injectable, inject } from '@angular/core';
import { ApiClient } from '../../../shared/api/api-client';

@Injectable({
  providedIn: 'root',
})
export class AppApi {
  private readonly api = inject(ApiClient);

  health() {
    return this.api.get<{
      status: string;
      environment: string;
      version: string;
    }>('/health');
  }
}
