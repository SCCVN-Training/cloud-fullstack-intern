import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { delay, map } from 'rxjs/operators';
import { PagedResult, Workshop, WorkshopFilters } from '../models/event.model';
import { WorkshopDetail } from '../models/workshop-detail.model';
import { WorkshopDetailService } from './workshop-detail.service';
// import { environment } from '../../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class EventService {
  // private readonly baseUrl = `${environment.apiBaseUrl}/events`;

  constructor(
    private http: HttpClient,
    private wsDetailService: WorkshopDetailService
  ) { }

  getWorkshops(
    filters: Partial<WorkshopFilters>,
    page = 1,
    pageSize = 3
  ): Observable<PagedResult<Workshop>> {
    // TODO: replace with real call once the EventService REST endpoint is live:
    // return this.http.get<PagedResult<Workshop>>(this.baseUrl, {
    //   params: this.buildParams(filters, page, pageSize),
    // });
    // NOTES: `filters` is accepted but not yet applied to this mock dataset ]
    // pagination is wired up to real data; filtering logic is a follow-up. 
    // return of(this.mockResult(page, pageSize)).pipe(delay(200));
    return this.wsDetailService.getAllWorkshop().pipe(
      map((allWorkshop) => this.toPagedResult(allWorkshop, page, pageSize)),
      delay(200)
    );
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

  private toPagedResult(
    allworkshop: WorkshopDetail[],
    page: number,
    pageSize: number
  ): PagedResult<Workshop> {
    const totalItems = allworkshop.length;
    const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
    const start = (page - 1) * pageSize;
    const items = allworkshop.slice(start, start + pageSize).map((w) => this.toCardWorkshop(w));

    return { items, page, totalItems, totalPages }

  }

  private toCardWorkshop(detail: WorkshopDetail): Workshop {
    return {
      id: detail.id,
      title: detail.title,
      categoryTags: [],
      speakerName: detail.speaker.name,
      dateLabel: detail.dateLabel,
      location: detail.location,
      format: detail.format,
      difficulty: detail.difficulty,
      topics: [],
      seatsFilled: detail.seatsFilled,
      seatsTotal: detail.seatsTotal,
      thumbnailUrl: detail.heroImageUrl,
    };
  }
}
