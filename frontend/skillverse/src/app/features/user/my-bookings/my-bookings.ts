import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Component } from '@angular/core';

@Component({
  selector: 'app-my-bookings',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './my-bookings.html',
  styleUrls: ['./my-bookings.scss'],
})
export class MyBookings {
  activeTab: string = 'Upcoming';
  tabs = ['Upcoming', 'Completed', 'Cancelled'];

  bookings = [
    {
      id: 1,
      title: 'Advanced Figma Prototyping',
      mentor: 'Sarah Jenkins',
      status: 'Confirmed',
      statusColorClass: 'bg-primary-container text-on-primary-container',
      statusIcon: 'check_circle',
      time: 'Tomorrow, 10:00 AM',
      avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBASFV_UC95A9nGCvwqYimd5EXz_J2l2D5Y7i2N_ZwBUSIAJWZWmhyxhwn-WHHEXiLcECOIjL6i6S2EQg1yv2-xcc1YDRuPNWJtYzH_QepW6A6JDznq1H5l1L1YFI5t6zp_FurWj92KogA5vsLT9ExmYdzeyJhlZHlmXilVn9iDOhTSqU6SPqfnpqeAtWJDPfOGTmP6ive50YrMu8UzL9-sqQvanP6JlYQaxvSLua6mE6azZ8ALatTuduPcj1NzuSUZi_x9_8N1A8QD',
      selected: true,
      tab: 'Upcoming',
      actionable: true,
      banner: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBBqRZ6SLAVad5YPlQim8pzoaeEhbF6uAoFGCnABYfR-qcWoBqvMrOVIVAPVmmzdQWElquxEwFTLicIR6ykQGtnnolk1SrtlKXjU0mRjD5kvG_TmQeQPU44eu7UXGgtdwx6Ys0AmE51ayZK_jr04UeqP-9nM-U4WlymFBMU7iLhSnPH5iclZk0rh0_PJg5EOqfbyCpHr3d_Q7ayQEnoqOFg_R5M4EZltwhsM34IRszSvUhKeo5elR60EGxyZk4OWkJyGKwCsW8-nctk',
      dateStr: 'Tomorrow, Oct 15',
      timeStr: '10:00 AM - 11:30 AM (90 mins)'
    },
    {
      id: 2,
      title: 'Conversational Spanish for Beginners',
      mentor: 'Carlos Mateo',
      status: 'Pending',
      statusColorClass: 'bg-surface-container-highest text-on-surface-variant',
      statusIcon: 'schedule',
      time: 'Oct 24, 2:30 PM',
      avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA4sIwGp16fIJ9bF7a50C8OstSfRSOXgwrYGmqjLQtymkP4rmfSgv42s29tM-jxf0nlwu4mBaRvIRyzSuHsEHaYJOZEXLufxTWk29nqTexr_xg5mbL9aKHR5TbeFmF96fifXJZEBJwpepkAXogVBKUsi4FIbyuMnQUa6eLJHF-Nn-KaW8TTmmLy3kNXGD2rvlWVy50gkl1thiwEmtPmULRV4B-k8d9bP-vQyh0JmkjPczbQGQ92n_cXA5GtOiHuPRCMo0rNnHBdZYpP',
      selected: false,
      tab: 'Upcoming',
      actionable: false,
      banner: '',
      dateStr: '',
      timeStr: ''
    },
    {
      id: 3,
      title: 'Python Data Analysis Basics',
      mentor: 'Elena Rostova',
      status: 'Confirmed',
      statusColorClass: 'bg-primary-container text-on-primary-container',
      statusIcon: 'check_circle',
      time: 'Oct 28, 6:00 PM',
      avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDHho6DLt0Kmj-8Tc6B1SnZb4RnNFtRDIgUPAGN2WB24ZhsRskZILYGQDEZGlH3RtB3F90ZM6KDi_DTadYrXh8Qu0dh6o8V5ZQ859BxieI0fUuHFSdUDw59DZ6pmSwAR8JhUg69jPZu61uP57gGGm0lEpaZM38rg-hhY5r6q7i52c0-DK9_nIZ0zZCqpTOgZb-5CNh83mT9ea0OgWZsOCNrLDAOTM1DPFEq-nWsIlVXQEcWV5wNjOeyMwJoSfX5SJilhUhCW9KY8FbB',
      selected: false,
      tab: 'Upcoming',
      actionable: true,
      banner: '',
      dateStr: '',
      timeStr: ''
    }
  ];

  get filteredBookings() {
    return this.bookings.filter(b => b.tab === this.activeTab);
  }
  
  get selectedBooking() {
    return this.bookings.find(b => b.selected) || this.bookings[0];
  }

  selectTab(tab: string) {
    this.activeTab = tab;
  }

  selectBooking(id: number) {
    this.bookings.forEach(b => b.selected = (b.id === id));
  }
}
