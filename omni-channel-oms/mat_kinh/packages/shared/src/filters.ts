import type { Article, ArticleStatus, Clinic, Product } from "./types";

export interface ProductFilter {
  need?: string;
  index?: string;
  coating?: string;
}

export function filterProducts(
  items: Product[],
  filter: ProductFilter,
): Product[] {
  return items.filter((item) => {
    const matchesNeed = !filter.need || item.needs.includes(filter.need);
    const matchesIndex = !filter.index || item.indexes.includes(filter.index);
    const matchesCoating =
      !filter.coating ||
      item.coatings.some((coating) =>
        coating.toLowerCase().includes(filter.coating?.toLowerCase() ?? ""),
      );

    return matchesNeed && matchesIndex && matchesCoating;
  });
}

export interface ArticleFilter {
  query?: string;
  category?: string;
  tag?: string;
  status?: ArticleStatus;
}

export function filterArticles(
  items: Article[],
  filter: ArticleFilter,
): Article[] {
  const query = filter.query?.trim().toLowerCase();

  return items.filter((item) => {
    const searchable =
      `${item.title} ${item.excerpt} ${item.tags.join(" ")}`.toLowerCase();
    const matchesQuery = !query || searchable.includes(query);
    const matchesCategory =
      !filter.category || item.category === filter.category;
    const matchesTag = !filter.tag || item.tags.includes(filter.tag);
    const matchesStatus = !filter.status || item.status === filter.status;

    return matchesQuery && matchesCategory && matchesTag && matchesStatus;
  });
}

export interface ClinicFilter {
  province?: string;
  district?: string;
  query?: string;
}

export function filterClinics(items: Clinic[], filter: ClinicFilter): Clinic[] {
  const query = filter.query?.trim().toLowerCase();

  return items.filter((item) => {
    const text =
      `${item.name} ${item.address} ${item.services.join(" ")}`.toLowerCase();
    const matchesProvince =
      !filter.province || item.province === filter.province;
    const matchesDistrict =
      !filter.district || item.district === filter.district;
    const matchesQuery = !query || text.includes(query);

    return matchesProvince && matchesDistrict && matchesQuery;
  });
}
