import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { SkillService } from '../../../core/services/skill/skill.service';
import { BookingService } from '../../../core/services/booking/booking.service';
import { Skill } from '../../../core/models/skill.model';

interface CalendarCell {
  date: Date;
  day: number;
  inMonth: boolean;
  isPast: boolean;
  isSelected: boolean;
}

@Component({
  selector: 'app-booking-session',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './booking-session.html',
  styleUrls: ['./booking-session.scss'],
})
export class BookingSession implements OnInit {
  readonly weekdayLabels = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

  // Every session is a fixed length — keeps mentor scheduling simple and
  // guarantees a transition gap before their next booking. Not derived
  // from the skill's advertised "duration" text.
  readonly sessionDurationMinutes = 45;

  skill = signal<Skill | null>(null);
  isLoading = signal(true);
  errorMessage = signal('');

  selectedDate = signal<Date>(this.defaultSelectedDate());
  // 24-hour "HH:mm" — matches <input type="time">'s native value format.
  startTime = signal<string>('11:30');
  viewMonth = signal<Date>(this.startOfMonth(this.selectedDate()));

  // The value actually submitted with the booking — kept as a plain
  // "YYYY-MM-DDTHH:mm" string (same shape a <input type="datetime-local">
  // produces) so confirmBooking() doesn't need to know it's now driven by
  // the calendar/time picker instead of a raw input.
  sessionDateTime = signal<string>(
    this.toDateTimeLocalString(this.selectedDate(), this.startTime()),
  );
  sessionNotes = signal('');

  isSubmitting = signal(false);
  submitError = signal('');

  monthLabel = computed(() =>
    this.viewMonth().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
  );

  calendarCells = computed<CalendarCell[]>(() => {
    const month = this.viewMonth();
    const firstOfMonth = new Date(month.getFullYear(), month.getMonth(), 1);
    // getDay(): 0=Sun..6=Sat — shift so the grid starts on Monday.
    const leadingDays = (firstOfMonth.getDay() + 6) % 7;
    const gridStart = new Date(firstOfMonth);
    gridStart.setDate(gridStart.getDate() - leadingDays);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selected = this.selectedDate();

    return Array.from({ length: 42 }, (_, i) => {
      const date = new Date(gridStart);
      date.setDate(gridStart.getDate() + i);
      return {
        date,
        day: date.getDate(),
        inMonth: date.getMonth() === month.getMonth(),
        isPast: date < today,
        isSelected: this.isSameDay(date, selected),
      };
    });
  });

  summaryDateLabel = computed(() =>
    this.selectedDate().toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }),
  );

  startTimeLabel = computed(() => this.formatTimeLabel(this.startTime()));
  endTime = computed(() => this.addMinutes(this.startTime(), this.sessionDurationMinutes));
  endTimeLabel = computed(() => this.formatTimeLabel(this.endTime()));

  rangeLabel = computed(
    () => `${this.startTimeLabel()} — ${this.endTimeLabel()} (${this.sessionDurationMinutes} min)`,
  );

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

  changeMonth(delta: number): void {
    const m = this.viewMonth();
    this.viewMonth.set(new Date(m.getFullYear(), m.getMonth() + delta, 1));
  }

  selectDay(cell: CalendarCell): void {
    if (cell.isPast) return;
    this.selectedDate.set(cell.date);
    this.syncSessionDateTime();
  }

  setStartTime(value: string): void {
    if (!value) return;
    this.startTime.set(value);
    this.syncSessionDateTime();
  }

  private syncSessionDateTime(): void {
    this.sessionDateTime.set(this.toDateTimeLocalString(this.selectedDate(), this.startTime()));
  }

  private defaultSelectedDate(): Date {
    const d = new Date();
    d.setDate(d.getDate() + 1); // tomorrow, so there's always a full day's notice
    d.setHours(0, 0, 0, 0);
    return d;
  }

  private startOfMonth(d: Date): Date {
    return new Date(d.getFullYear(), d.getMonth(), 1);
  }

  private isSameDay(a: Date, b: Date): boolean {
    return (
      a.getFullYear() === b.getFullYear() &&
      a.getMonth() === b.getMonth() &&
      a.getDate() === b.getDate()
    );
  }

  private toDateTimeLocalString(date: Date, hhmm: string): string {
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${hhmm}`;
  }

  private formatTimeLabel(hhmm: string): string {
    const [hour, minute] = hhmm.split(':').map(Number);
    return new Date(2000, 0, 1, hour, minute).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    });
  }

  private addMinutes(hhmm: string, minutesToAdd: number): string {
    const [hour, minute] = hhmm.split(':').map(Number);
    const d = new Date(2000, 0, 1, hour, minute);
    d.setMinutes(d.getMinutes() + minutesToAdd);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
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
          // 422 is specifically what the backend returns for
          // insufficient balance (see WalletService.charge_for_booking) —
          // a clearer message than the raw backend detail string.
          this.submitError.set(
            err?.status === 422
              ? "You don't have enough Skill Coins for this session. Top up your wallet and try again."
              : err?.error?.detail || 'Could not confirm this booking. Please try again.',
          );
        },
      });
  }
}
