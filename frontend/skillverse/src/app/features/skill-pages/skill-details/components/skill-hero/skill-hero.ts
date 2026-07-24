import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-skill-hero',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './skill-hero.html',
  styleUrls: ['./skill-hero.scss'],
})
export class SkillHero {
  skill = {
    category: 'Creative Arts',

    rating: 4.9,

    reviews: 128,

    title: 'Mastering Digital Illustration with Procreate',

    description:
      'Learn to create stunning digital artwork from sketch to final render. Perfect for beginners looking to unlock their creative potential on the iPad.',

    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuAyZNZ1IVTcoO9W-9qU0iTeRUTx5bUn8C4moFgwOCOBFtDkq8KLSDHl4DcRLtZmNOX8RgbCtschd0SPM66yKWlvsOB-l5KbwyuUJHUzfCpI478Sydwim5AkJ5CTfjTVmftQeYpFT6G60Y6m5baQX19RB_a3sPCZb3rF1WMhBgBbI5mD5WJzJfTAFg7_nez7Y0ru2964P0IRfkHlXhCd9lvbq4l6D3SnGGqcMGVW7oSmpOclU5RkRQkdKs4G1hmG_IDboE9ddupWcoTD',
  };
}
