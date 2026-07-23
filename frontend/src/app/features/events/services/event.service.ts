import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';
import { PagedResult, Workshop, WorkshopFilters } from '../models/event.model';
// import { environment } from '../../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class EventService {
  // private readonly baseUrl = `${environment.apiBaseUrl}/events`;

  constructor(private http: HttpClient) {}

  getWorkshops(
    filters: Partial<WorkshopFilters>,
    page = 1,
    pageSize = 3
  ): Observable<PagedResult<Workshop>> {
    // TODO: replace with real call once the EventService REST endpoint is live:
    // return this.http.get<PagedResult<Workshop>>(this.baseUrl, {
    //   params: this.buildParams(filters, page, pageSize),
    // });
    return of(this.mockResult(page, pageSize)).pipe(delay(200));
  }

  private buildParams(filters: Partial<WorkshopFilters>, page: number, pageSize: number): HttpParams {
    let params = new HttpParams().set('page', page).set('pageSize', pageSize);
    if (filters.keyword) params = params.set('keyword', filters.keyword);
    if (filters.timeline) params = params.set('timeline', filters.timeline);
    if (filters.difficulty) params = params.set('difficulty', filters.difficulty);
    filters.formats?.forEach((f) => (params = params.append('format', f)));
    filters.topics?.forEach((t) => (params = params.append('topic', t)));
    return params;
  }

  private mockResult(page: number, pageSize: number): PagedResult<Workshop> {
    const all: Workshop[] = [
      {
        id: 'wk-1',
        title: 'Global Supply Chain Resilience 2024',
        categoryTags: ['LOGISTICS', 'STRATEGY'],
        speakerName: 'Dr. Elena Rodriguez',
        dateLabel: 'Oct 24, 2024 | 10:00 AM',
        location: 'Main Hall, HQ-12',
        format: 'in-person',
        difficulty: 'intermediate',
        topics: ['Supply Chain', 'Compliance'],
        seatsFilled: 42,
        seatsTotal: 50,
        thumbnailUrl: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=800&auto=format&fit=crop',
      },
      {
        id: 'wk-2',
        title: 'Predictive Analytics for Warehousing',
        categoryTags: ['AI & ML', 'AUTOMATION'],
        speakerName: 'Marcus Chen',
        dateLabel: 'Oct 26, 2024 | 02:00 PM',
        location: 'Microsoft Teams Link',
        format: 'virtual',
        difficulty: 'advanced',
        topics: ['Analytics', 'AI & ML'],
        seatsFilled: 156,
        seatsTotal: 200,
        thumbnailUrl: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&auto=format&fit=crop',
      },
      {
        id: 'wk-3',
        title: 'Change Management in Logistics',
        categoryTags: ['LEADERSHIP', 'MANAGEMENT'],
        speakerName: 'Robert Sterling',
        dateLabel: 'Nov 02, 2024 | 09:00 AM',
        location: 'Conference Center B',
        format: 'in-person',
        difficulty: 'beginner',
        topics: ['Leadership'],
        seatsFilled: 12,
        seatsTotal: 25,
        thumbnailUrl: 'https://images.unsplash.com/photo-1466611653911-95081537e5b7?w=800&auto=format&fit=crop',
      },
      {
        id: 'wk-4',
        title: 'Lean Warehouse Operations Workshop',
        categoryTags: ['OPERATIONS'],
        speakerName: 'David Wu',
        dateLabel: 'Nov 05, 2024 | 11:00 AM',
        location: 'Logistics Hub C',
        format: 'in-person',
        difficulty: 'intermediate',
        topics: ['Supply Chain', 'Sustainability'],
        seatsFilled: 22,
        seatsTotal: 30,
        thumbnailUrl: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=800&auto=format&fit=crop',
      },
    ];

    const start = (page - 1) * pageSize;
    const items = all.slice(start, start + pageSize);
    return {
      items,
      page,
      totalItems: 12,
      totalPages: 8,
    };
  }
}
