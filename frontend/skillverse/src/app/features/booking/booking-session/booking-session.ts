import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { SkillService } from '../../../core/services/skill/skill.service';
import { BookingService } from '../../../core/services/booking/booking.service';
import { Skill } from '../../../core/models/skill.model';

@Component({
  selector: 'app-booking-session',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './booking-session.html',
  styleUrls: ['./booking-session.scss'],
})
export class BookingSession implements OnInit {
  skill = signal<Skill | null>(null);
  isLoading = signal(true);
  errorMessage = signal('');

  // Bound to the date/time <input>. Defaults to one hour from now so the
  // field is never empty — the backend requires session_date.
  sessionDateTime = signal<string>(this.defaultDateTime());
  sessionNotes = signal('');

  isSubmitting = signal(false);
  submitError = signal('');

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private skillService: SkillService,
    private bookingService: BookingService,
  ) {}

  ngOnInit(): void {
    const skillId = this.route.snapshot.paramMap.get('skillId');
    if (!skillId) {
      this.errorMessage.set('No skill selected to book.');
      this.isLoading.set(false);
      return;
    }

    this.skillService.getSkillById(skillId).subscribe({
      next: (data) => {
        this.skill.set(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Failed to load skill for booking:', err);
        this.errorMessage.set('Unable to load this skill. Please go back and try again.');
        this.isLoading.set(false);
      },
    });
  }

  private defaultDateTime(): string {
    const oneHourFromNow = new Date(Date.now() + 60 * 60 * 1000);
    // datetime-local input needs "YYYY-MM-DDTHH:mm", local time, no timezone
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${oneHourFromNow.getFullYear()}-${pad(oneHourFromNow.getMonth() + 1)}-${pad(oneHourFromNow.getDate())}T${pad(oneHourFromNow.getHours())}:${pad(oneHourFromNow.getMinutes())}`;
  }

  confirmBooking(): void {
    const skill = this.skill();
    if (!skill) return;

    this.isSubmitting.set(true);
    this.submitError.set('');

    this.bookingService
      .createBooking({
        skillId: skill.id,
        sessionDate: new Date(this.sessionDateTime()).toISOString(),
        sessionNotes: this.sessionNotes() || undefined,
      })
      .subscribe({
        next: () => {
          this.isSubmitting.set(false);
          this.router.navigate(['/user/my-bookings']);
        },
        error: (err) => {
          console.error('Failed to create booking:', err);
          this.isSubmitting.set(false);
          this.submitError.set(
            err?.error?.detail || 'Could not confirm this booking. Please try again.',
          );
        },
      });
  }
}
