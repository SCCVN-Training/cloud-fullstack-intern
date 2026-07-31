import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Skill } from '../../../../../core/models/skill.model';

@Component({
  selector: 'app-skill-about',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './skill-about.html',
  styleUrl: './skill-about.scss',
})
export class SkillAbout {
  @Input({ required: true }) skill!: Skill;
}
