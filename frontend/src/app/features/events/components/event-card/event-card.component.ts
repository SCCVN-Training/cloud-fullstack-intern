import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { RouterModule } from '@angular/router';
import { Workshop } from '../../models/event.model';

@Component({
  selector: 'app-event-card',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './event-card.component.html',
  styleUrls: ['./event-card.component.scss'],
})
export class EventCardComponent {
  @Input({ required: true }) workshop!: Workshop;

  get seatsLabel(): string {
    return `${this.workshop.seatsFilled} / ${this.workshop.seatsTotal} seats`;
  }

  get capacityPercent(): number {
    return Math.round((this.workshop.seatsFilled / this.workshop.seatsTotal) * 100);
  }
}
