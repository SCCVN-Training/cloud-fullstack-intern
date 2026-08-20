import { Component, input, output } from '@angular/core';
import { MatButtonToggle, MatButtonToggleGroup } from '@angular/material/button-toggle';
import { MatIcon } from '@angular/material/icon';

export interface TemplateMode {
  id: string;
  label: string;
  icon: string;
}

@Component({
  selector: 'app-mode-switcher',
  standalone: true,
  imports: [MatButtonToggleGroup, MatButtonToggle, MatIcon],
  templateUrl: './mode-switcher.html',
  styleUrl: './mode-switcher.scss',
})
export class ModeSwitcher {
  readonly modes = input.required<TemplateMode[]>();
  readonly active = input.required<string>();
  readonly label = input('Preview layout');
  readonly changed = output<string>();
}
