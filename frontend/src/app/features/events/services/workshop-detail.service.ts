import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';
import { WorkshopDetail } from '../models/workshop-detail.model';
// import { environment } from '../../../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class WorkshopDetailService {
  // private readonly baseUrl = `${environment.apiBaseUrl}/events`;

  constructor(private http: HttpClient) {}

  getWorkshopById(id: string): Observable<WorkshopDetail> {
    // TODO: replace with the real call once EventService's GET /events/:id is live:
    // return this.http.get<WorkshopDetail>(`${this.baseUrl}/${id}`);
    return of(this.mockDetail(id)).pipe(delay(200));
  }

  private mockDetail(id: string): WorkshopDetail {
    return {
      id,
      title: 'Global Supply Chain Resilience 2024',
      status: 'published',
      heroImageUrl: 'assets/images/workshops/supply-chain-hero.jpg',
      dateLabel: 'Oct 24, 2024',
      timeLabel: '10:00 AM (2h)',
      location: 'Main Hall, HQ-12',
      format: 'in-person',
      difficulty: 'intermediate',
      seatsFilled: 42,
      seatsTotal: 50,
      speaker: {
        name: 'Dr. Elena Rodriguez',
        title: 'Head of Global Logistics',
        bio: "Dr. Rodriguez is a distinguished expert with over 20 years of experience in optimizing international logistics chains. Her work focuses on integrating AI-driven predictive modeling to mitigate risks in global trade routes. She has pioneered resilience frameworks for SCC's top enterprise partners.",
        avatarUrl: 'assets/images/speakers/elena-rodriguez.jpg',
      },
      description:
        'In an era of increasing global volatility, the ability to build and maintain a resilient supply chain is no longer just a competitive advantage — it is a survival necessity. This intensive 2-hour workshop will deconstruct the current landscape of global logistics and provide actionable strategies for risk management.',
      learningObjectives: [
        'Identify and quantify high-probability disruptors in the current logistics cycle.',
        "Develop a 'Dual-Source' strategy framework for critical component procurement.",
        'Implement real-time visibility tools across multi-tier supplier networks.',
      ],
      prerequisites:
        "Participants should have a foundational understanding of SCC's core logistical platform and at least 3 years of experience in supply chain management or procurement roles.",
    };
  }
}
