import { PaginatedResponse } from "../types/api";
import { apiRequest } from "./httpClient";

// Keep requests on the configured API; never follow absolute pagination URLs.
export async function loadAllPages<T>(path: string): Promise<T[]> {
  const items: T[] = [];
  let page = 1;
  while (true) {
    const response = await apiRequest<T[] | PaginatedResponse<T>>(
      `${path}${path.includes("?") ? "&" : "?"}page=${page}`,
    );
    if (Array.isArray(response)) return [...items, ...response];
    items.push(...response.results);
    if (!response.next) return items;
    page += 1;
  }
}
