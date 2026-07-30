import { CommonModule } from '@angular/common';
import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { WorkshopDetailService } from '../../services/workshop-detail.service';
import { WorkshopDetail } from '../../models/workshop-detail.model';
import { WorkshopHeroComponent } from './components/workshop-hero/workshop-hero.component';
import { WorkshopMetaGridComponent } from './components/workshop-meta-grid/workshop-meta-grid.component';
import { WorkshopSpeakerComponent } from './components/workshop-speaker/workshop-speaker.component';
import { WorkshopTabsComponent } from './components/workshop-tabs/workshop-tabs.component';
import { WorkshopRegistrationCardComponent } from './components/workshop-registration-card/workshop-registration-card.component';
import { HelpCardComponent } from '../../../../shared/components/help-card/help-card.component';

@Component({
  selector: 'app-workshop-detail',
  standalone: true,
  imports: [
    CommonModule,
    WorkshopHeroComponent,
    WorkshopMetaGridComponent,
    WorkshopSpeakerComponent,
    WorkshopTabsComponent,
    WorkshopRegistrationCardComponent,
    HelpCardComponent,
  ],
  templateUrl: './workshop-detail.component.html',
  styleUrls: ['./workshop-detail.component.scss'],
})
export class WorkshopDetailComponent implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  workshop: WorkshopDetail | null = null;
  isLoading = false;
  loadError = false;

  constructor(
    private route: ActivatedRoute,
    private workshopDetailService: WorkshopDetailService
  ) {}

  ngOnInit(): void {
    // --- MODIFICATION 1: Synchronous Snapshot Fallback ---
    // Extract the ID from snapshot first to support unit test stubs that mock route.snapshot
    const snapshotId = this.route.snapshot?.paramMap?.get('id');

    if (snapshotId !== undefined) {
      this.handleRouteId(snapshotId);
      return;
    }

    // --- MODIFICATION 2: Observable Stream Fallback ---
    // If paramMap Observable exists (e.g., live app navigation), subscribe to route changes
    if (this.route.paramMap) {
      this.route.paramMap
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe((paramMap) => {
          const id = paramMap.get('id');
          this.handleRouteId(id);
        });
    } else {
      // Handles case where paramMap is completely omitted/null
      this.handleRouteId(null);
    }
  }

  onRegister(workshopId: string): void {
    console.log('Register requested for workshop', workshopId);
  }

  // --- MODIFICATION 3: Refactored Route ID Handler ---
  // Centralized guard check ensuring state flags update predictably
  private handleRouteId(id: string | null): void {
    if (!id) {
      this.workshop = null;
      this.isLoading = false;
      this.loadError = true;
      return;
    }

    this.loadWorkshop(id);
  }

  private loadWorkshop(id: string): void {
    this.isLoading = true;
    this.loadError = false;
    
    this.workshopDetailService.getWorkshopById(id).subscribe({
      next: (workshop) => {
        this.workshop = workshop;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('WorkshopDetailComponent load error:', err);
        this.workshop = null;
        this.loadError = true;
        this.isLoading = false;
      },
    });
  }
}