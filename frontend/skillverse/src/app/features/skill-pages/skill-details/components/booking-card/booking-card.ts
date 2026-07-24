import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-booking-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './booking-card.html',
  styleUrl: './booking-card.scss',
})
export class BookingCard {
  price = 150;
  duration = '60 Minutes';
  level = 'Beginner to Intermediate';
  requirements = 'iPad & Apple Pencil';
}
