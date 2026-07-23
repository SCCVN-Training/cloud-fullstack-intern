import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
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
  styleUrl: './workshop-detail.component.scss',
})
export class WorkshopDetailComponent implements OnInit {
  workshop: WorkshopDetail | null = null;
  isLoading = false;
  loadError = false;

  constructor(
    private route: ActivatedRoute,
    private workshopDetailService: WorkshopDetailService
  ) {}

  ngOnInit(): void {
    // Route is defined as 'workshop/:id' — see events.routes.ts.
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.loadError = true;
      return;
    }
    this.loadWorkshop(id);
  }

  onRegister(workshopId: string): void {
    // TODO: hand off to a real RegistrationService once it exists.
    // The registration card already tracks its own idle/processing/registered
    // UI state locally — this handler is where you'd fire the actual API call
    // and reconcile state if it fails.
    console.log('Register requested for workshop', workshopId);
  }

  private loadWorkshop(id: string): void {
    this.isLoading = true;
    this.loadError = false;
    this.workshopDetailService.getWorkshopById(id).subscribe({
      next: (workshop) => {
        this.workshop = workshop;
        this.isLoading = false;
      },
      error: () => {
        this.loadError = true;
        this.isLoading = false;
      },
    });
  }
}
