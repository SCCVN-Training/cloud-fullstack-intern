export interface ApiListResponse<T> {
  data: T[];
  pagination: Pagination;
}

export interface Pagination {
  current_page: number;
  has_next_page: boolean;
  last_visible_page: number;
}
