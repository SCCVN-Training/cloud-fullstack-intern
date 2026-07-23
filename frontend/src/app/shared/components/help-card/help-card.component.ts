import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-help-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './help-card.component.html',
  styleUrl: './help-card.component.scss',
})
export class HelpCardComponent {
  @Input() title = 'Need assistance?';
  @Input() message = 'Contact the support team for any special requirements or requests.';
  @Input() linkLabel = 'Contact Support';
  @Input() linkHref = '#';
}
