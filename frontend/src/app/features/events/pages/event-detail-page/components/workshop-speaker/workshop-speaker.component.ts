import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { WorkshopSpeaker } from '../../../../models/workshop-detail.model';

@Component({
  selector: 'app-workshop-speaker',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './workshop-speaker.component.html',
  styleUrl: './workshop-speaker.component.scss',
})
export class WorkshopSpeakerComponent {
  @Input({ required: true }) speaker!: WorkshopSpeaker;
}
