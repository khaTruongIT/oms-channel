export function formatDate(value: string | null): string {
  if (!value) {
    return "Chua xuat ban";
  }

  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(value));
}

export function getUniqueValues<T>(
  items: T[],
  pick: (item: T) => string,
): string[] {
  return Array.from(new Set(items.map(pick))).sort((left, right) =>
    left.localeCompare(right),
  );
}
