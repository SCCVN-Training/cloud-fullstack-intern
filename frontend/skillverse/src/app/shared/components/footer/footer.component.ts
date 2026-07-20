import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

interface FooterLink {
  label: string;
  route: string;
}

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink
  ],
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.scss']
})
export class FooterComponent {

  readonly quickLinks: FooterLink[] = [
    {
      label: 'Home',
      route: '/'
    },
    {
      label: 'Browse Skills',
      route: '/browse-skills'
    },
    {
      label: 'About Us',
      route: '/about-us'
    },
    {
      label: 'How It Works',
      route: '/how-it-works'
    }
  ];

  readonly currentYear = new Date().getFullYear();
}