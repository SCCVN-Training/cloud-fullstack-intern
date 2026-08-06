import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

@Component({
  selector: 'app-create-skill',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './create-skill.html',
  styleUrls: ['./create-skill.scss'],
})
export class CreateSkill {
  selectedLevel: string = 'beginner';

  selectLevel(level: string) {
    this.selectedLevel = level;
  }
}
