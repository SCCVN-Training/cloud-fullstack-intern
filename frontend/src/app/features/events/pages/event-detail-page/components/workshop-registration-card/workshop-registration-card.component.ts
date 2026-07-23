import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { WorkshopDetail } from '../../../../models/workshop-detail.model';

type RegistrationStatus = 'idle' | 'processing' | 'registered';

@Component({
  selector: 'app-workshop-registration-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './workshop-registration-card.component.html',
  styleUrl: './workshop-registration-card.component.scss',
})
export class WorkshopRegistrationCardComponent {
  @Input({ required: true }) workshop!: WorkshopDetail;

  /** Parent decides what a real registration call does; this component only reports intent. */
  @Output() register = new EventEmitter<string>();

  status: RegistrationStatus = 'idle';

  get seatsRemaining(): number {
    return Math.max(this.workshop.seatsTotal - this.workshop.seatsFilled, 0);
  }

  get capacityPercent(): number {
    if (this.workshop.seatsTotal <= 0) return 0;
    const pct = (this.workshop.seatsFilled / this.workshop.seatsTotal) * 100;
    return Math.min(Math.max(pct, 0), 100);
  }

  onRegisterClick(): void {
    if (this.status !== 'idle') return;
    this.status = 'processing';
    this.register.emit(this.workshop.id);

    // TODO: this local timeout stands in for a real RegistrationService call.
    // Once wired up, drive `status` off the actual HTTP response instead:
    // this.registrationService.register(this.workshop.id).subscribe({
    //   next: () => (this.status = 'registered'),
    //   error: () => (this.status = 'idle'),
    // });
    setTimeout(() => {
      this.status = 'registered';
    }, 1200);
  }
}
