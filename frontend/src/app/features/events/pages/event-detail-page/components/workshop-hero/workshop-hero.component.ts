import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { WorkshopDetail } from '../../../../models/workshop-detail.model';

@Component({
  selector: 'app-workshop-hero',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './workshop-hero.component.html',
  styleUrl: './workshop-hero.component.scss',
})
export class WorkshopHeroComponent {
  @Input({ required: true }) workshop!: WorkshopDetail;
}
