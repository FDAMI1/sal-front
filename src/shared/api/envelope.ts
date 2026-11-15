/** The server's success envelope (docs/API.md). */
export interface Envelope<T> {
  success: true;
  data: T;
  message?: string;
  meta?: PageMeta;
}

export interface PageMeta {
  total: number;
  page: number;
  pages: number;
}

/** A page of a list together with its paging info. */
export interface Paged<T, M extends PageMeta = PageMeta> {
  items: T[];
  meta: M;
}
