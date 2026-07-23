import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Output } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { WorkshopDifficulty, WorkshopFilters, WorkshopFormat } from '../../models/event.model';

@Component({
  selector: 'app-event-filters',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './event-filters.component.html',
  styleUrl: './event-filters.component.scss',
})
export class EventFiltersComponent {
  @Output() filtersChanged = new EventEmitter<Partial<WorkshopFilters>>();

  readonly availableTopics = ['Supply Chain', 'Analytics', 'AI & ML', 'Compliance', 'Sustainability'];

  form: FormGroup;

  constructor(private fb: FormBuilder) {
    this.form = this.fb.group({
      keyword: [''],
      timeline: ['this-week' as WorkshopFilters['timeline']],
      formats: this.fb.group({
        'in-person': [true],
        virtual: [false],
      }),
      difficulty: ['intermediate' as WorkshopDifficulty | null],
      topics: [[] as string[]],
    });
  }

  toggleTopic(topic: string): void {
    const current = this.form.value.topics ?? [];
    const next = current.includes(topic) ? current.filter((t: string) => t !== topic) : [...current, topic];
    this.form.patchValue({ topics: next });
  }

  isTopicSelected(topic: string): boolean {
    return (this.form.value.topics ?? []).includes(topic);
  }

  applyFilters(): void {
    const raw = this.form.value;
    const formats: WorkshopFormat[] = Object.entries(raw.formats ?? {})
      .filter(([, checked]) => checked)
      .map(([format]) => format as WorkshopFormat);

    this.filtersChanged.emit({
      keyword: raw.keyword ?? '',
      timeline: raw.timeline ?? 'all',
      formats,
      difficulty: raw.difficulty ?? null,
      topics: raw.topics ?? [],
    });
  }
}
