import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Skill } from '../../../../../core/models/skill.model';

@Component({
  selector: 'app-skill-hero',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './skill-hero.html',
  styleUrls: ['./skill-hero.scss'],
})
export class SkillHero {
  @Input({ required: true }) skill!: Skill;

  // Add this for debugging
  ngOnInit() {
    console.log('SkillHero received skill:', this.skill?.title);
  }
}
