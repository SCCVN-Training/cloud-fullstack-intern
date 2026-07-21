import { Component, inject } from '@angular/core';
import { AppStore } from '../../../core/app/data-access/with-app-store';

@Component({
  selector: 'app-footer',
  standalone: true,
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.scss'],
})
export class FooterComponent {
  private readonly appStore = inject(AppStore);
  version = this.appStore.version();
  currentYear = new Date().getFullYear();
}
