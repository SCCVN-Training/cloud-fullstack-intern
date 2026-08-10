import { AfterViewInit, Component, ElementRef, OnDestroy, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

import { Chart, ChartConfiguration, registerables } from 'chart.js';

import { AdminStatCardComponent } from '../shared/admin-stat-card/admin-stat-card';

Chart.register(...registerables);

interface StatCard {
  label: string;
  value: string;
  percentage: string;
  icon: string;
  type: 'skills' | 'bookings' | 'coins';
}

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, AdminStatCardComponent],
  templateUrl: './admin-dashboard.html',
  styleUrls: ['./admin-dashboard.scss'],
})
export class AdminDashboardComponent implements AfterViewInit, OnDestroy {
  @ViewChild('growthChart')
  private readonly growthChart?: ElementRef<HTMLCanvasElement>;

  private chart?: Chart;

  readonly stats: StatCard[] = [
    {
      label: 'Active Skills',
      value: '1,840',
      percentage: '+5%',
      icon: 'psychology',
      type: 'skills',
    },
    {
      label: 'Total Bookings',
      value: '3,210',
      percentage: '+24%',
      icon: 'event_available',
      type: 'bookings',
    },
    {
      label: 'Skill Coins',
      value: '850,000 SC',
      percentage: '+8%',
      icon: 'toll',
      type: 'coins',
    },
  ];

  ngAfterViewInit(): void {
    this.createGrowthChart();
  }

  ngOnDestroy(): void {
    this.chart?.destroy();
  }

  private createGrowthChart(): void {
    const canvas = this.growthChart?.nativeElement;

    if (!canvas) {
      return;
    }

    const context = canvas.getContext('2d');

    if (!context) {
      return;
    }

    const gradient = context.createLinearGradient(0, 0, 0, 400);

    gradient.addColorStop(0, 'rgba(164, 48, 115, 0.25)');

    gradient.addColorStop(1, 'rgba(164, 48, 115, 0)');

    const configuration: ChartConfiguration<'line'> = {
      type: 'line',

      data: {
        labels: ['Day 1', 'Day 5', 'Day 10', 'Day 15', 'Day 20', 'Day 25', 'Day 30'],

        datasets: [
          {
            label: 'New Registrations',

            data: [120, 150, 140, 200, 250, 220, 310],

            borderColor: '#a43073',
            backgroundColor: gradient,

            borderWidth: 3,
            tension: 0.4,
            fill: true,

            pointBackgroundColor: '#ffffff',
            pointBorderColor: '#a43073',
            pointBorderWidth: 2,
            pointRadius: 4,
            pointHoverRadius: 6,
          },

          {
            label: 'Bookings',

            data: [80, 110, 160, 180, 210, 260, 290],

            borderColor: '#8f4953',

            borderWidth: 3,
            borderDash: [5, 5],
            tension: 0.4,
            fill: false,

            pointBackgroundColor: '#ffffff',
            pointBorderColor: '#8f4953',
            pointBorderWidth: 2,
            pointRadius: 4,
            pointHoverRadius: 6,
          },
        ],
      },

      options: {
        responsive: true,

        maintainAspectRatio: false,

        interaction: {
          intersect: false,
          mode: 'index',
        },

        plugins: {
          legend: {
            position: 'top',
            align: 'end',

            labels: {
              usePointStyle: true,
              padding: 20,

              font: {
                family: 'Plus Jakarta Sans',
                size: 13,
                weight: 500,
              },

              color: '#544249',
            },
          },

          tooltip: {
            backgroundColor: 'rgba(255, 255, 255, 0.96)',

            titleColor: '#121c2a',
            bodyColor: '#544249',

            borderColor: '#dac0c9',
            borderWidth: 1,

            padding: 12,

            usePointStyle: true,

            titleFont: {
              family: 'Plus Jakarta Sans',
              size: 13,
              weight: 600,
            },

            bodyFont: {
              family: 'Plus Jakarta Sans',
              size: 12,
            },
          },
        },

        scales: {
          x: {
            grid: {
              display: false,
            },

            border: {
              display: false,
            },

            ticks: {
              color: '#87717a',

              font: {
                family: 'Plus Jakarta Sans',
                size: 11,
              },
            },
          },

          y: {
            beginAtZero: true,

            grid: {
              color: '#ece6ec',
            },

            border: {
              display: false,
            },

            ticks: {
              color: '#87717a',

              padding: 10,

              font: {
                family: 'Plus Jakarta Sans',
                size: 11,
              },
            },
          },
        },
      },
    };

    this.chart = new Chart(context, configuration);
  }
}
