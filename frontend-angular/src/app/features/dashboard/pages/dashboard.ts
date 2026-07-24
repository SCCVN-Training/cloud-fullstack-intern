import { Component } from '@angular/core';

import { RouterModule } from '@angular/router';

import { DashboardNavbar } from '../components/navbar/dashboard-navbar';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterModule, DashboardNavbar],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard {}
