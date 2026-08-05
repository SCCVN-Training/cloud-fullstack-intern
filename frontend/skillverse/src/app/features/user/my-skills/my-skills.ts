import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-my-skills',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './my-skills.html',
  styleUrls: ['./my-skills.scss'],
})
export class MySkills {
  skills = [
    {
      title: 'Advanced Watercolor Techniques',
      description: 'Master fluid dynamics and color blending for stunning landscapes.',
      status: 'Active',
      icon: 'brush',
      tone: 'primary',
      students: 42,
      coins: 1250,
    },
    {
      title: 'Intro to Python for Data Science',
      description: 'Learn the basics of Pandas, NumPy, and data visualization.',
      status: 'Active',
      icon: 'code',
      tone: 'tertiary',
      students: 18,
      coins: 890,
    },
  ];
}
