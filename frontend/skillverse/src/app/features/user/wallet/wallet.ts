import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Component } from '@angular/core';

@Component({
  selector: 'app-wallet',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './wallet.html',
  styleUrls: ['./wallet.scss'],
})
export class Wallet {
  balance = 1250;
  
  activities = [
    {
      group: 'Today',
      items: [
        {
          title: 'Advanced UI Design Coaching',
          description: 'Session with Sarah Jenkins',
          icon: 'psychology',
          colorClass: 'primary',
          time: '14:30 PM',
          status: 'Completed',
          amount: '+450 SC',
          isPositive: true
        },
        {
          title: 'Business Spanish Workshop',
          description: 'Booking confirmation',
          icon: 'language',
          colorClass: 'secondary',
          time: '09:15 AM',
          status: 'Reservation',
          amount: '-200 SC',
          isPositive: false
        }
      ]
    },
    {
      group: 'Yesterday',
      items: [
        {
          title: 'Coin Pack: Professional Booster',
          description: 'In-app purchase',
          icon: 'add_card',
          colorClass: 'tertiary',
          time: '18:20 PM',
          status: 'Credit Card',
          amount: '+1,500 SC',
          isPositive: true
        },
        {
          title: 'Community Badge Awarded',
          description: '"Expert Communicator" Level 2',
          icon: 'verified',
          colorClass: 'neutral',
          time: '12:00 PM',
          status: 'System',
          amount: '--',
          isPositive: null
        }
      ]
    }
  ];
}
