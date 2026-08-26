export interface ApiResponse<Data> {
  message: string;
  data: Data;
  meta: null;
}

export interface ApiResponseWithMeta<Data, Meta> {
  message: string;
  data: Data;
  meta: Meta;
}
