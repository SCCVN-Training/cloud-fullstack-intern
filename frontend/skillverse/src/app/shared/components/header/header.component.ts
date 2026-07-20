import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';

interface NavigationItem {
  label: string;
  route: string;
}

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    RouterLinkActive
  ],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent {

  readonly navigationItems: NavigationItem[] = [
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
}