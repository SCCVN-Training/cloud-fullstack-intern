import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { WorkshopDetail } from '../../../../models/workshop-detail.model';

interface MetaItem {
  icon: string;
  label: string;
  value: string;
}

@Component({
  selector: 'app-workshop-meta-grid',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './workshop-meta-grid.component.html',
  styleUrl: './workshop-meta-grid.component.scss',
})
export class WorkshopMetaGridComponent {
  @Input({ required: true }) workshop!: WorkshopDetail;

  get items(): MetaItem[] {
    const w = this.workshop;
    return [
      { icon: 'calendar_today', label: 'Date', value: w.dateLabel },
      { icon: 'schedule', label: 'Time', value: w.timeLabel },
      { icon: 'location_on', label: 'Location', value: w.location },
      { icon: 'group', label: 'Capacity', value: `${w.seatsTotal} Seats Max` },
    ];
  }
}
