import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { WorkshopDetail, WorkshopTabId } from '../../../../models/workshop-detail.model';

interface TabDef {
  id: WorkshopTabId;
  label: string;
}

@Component({
  selector: 'app-workshop-tabs',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './workshop-tabs.component.html',
  styleUrl: './workshop-tabs.component.scss',
})
export class WorkshopTabsComponent {
  @Input({ required: true }) workshop!: WorkshopDetail;

  readonly tabs: TabDef[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'materials', label: 'Materials' },
    { id: 'qa', label: 'Q&A' },
    { id: 'attendees', label: 'Attendees' },
  ];

  activeTab: WorkshopTabId = 'overview';

  selectTab(tab: WorkshopTabId): void {
    this.activeTab = tab;
  }

  get activeTabLabel(): string {
    return this.tabs.find((t) => t.id === this.activeTab)?.label ?? '';
  }
}
