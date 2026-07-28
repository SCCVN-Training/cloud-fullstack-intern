import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Skill } from '../../../../../core/models/skill.model';

@Component({
  selector: 'app-instructor-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './instructor-card.html',
  styleUrls: ['./instructor-card.scss'],
})
export class InstructorCard {
  @Input({ required: true }) skill!: Skill;
}
