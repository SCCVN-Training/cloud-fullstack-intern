import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Skill } from '../../../../../core/models/skill.model';

@Component({
  selector: 'app-booking-card',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './booking-card.html',
  styleUrls: ['./booking-card.scss'],
})
export class BookingCard {
  @Input({ required: true }) skill!: Skill;
}
