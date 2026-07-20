import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

interface NavItem {
  label: string;
  path: string;
  icon: string;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss']
})
export class SidebarComponent {
  protected readonly navItems: NavItem[] = [
    { label: 'Dashboard', path: '/dashboard', icon: 'home' },
    { label: 'Events', path: '/events', icon: 'event' },
    { label: 'My Registrations', path: '/registrations', icon: 'assignment' },
    { label: 'My Speaking Events', path: '/speakers', icon: 'mic' },
    { label: 'Rooms', path: '/rooms', icon: 'meeting_room' },
    { label: 'Notifications', path: '/notifications', icon: 'notifications' },
    { label: 'Profile', path: '/profile', icon: 'person' },
    { label: 'Reports', path: '/reports', icon: 'bar_chart' }
  ];
}
