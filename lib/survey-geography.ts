import { POSTAL_CITIES } from './data/postal-cities.ts';

export function surveyGeography(rows: { postal_code?: string | null }[]) {
  const places = new Map<string, { label: string; count: number; postalCodes: string[] }>();
  for (const row of rows) {
    const code = typeof row.postal_code === 'string' ? row.postal_code.trim() : '';
    const city = /^\d{4}$/.test(code) ? POSTAL_CITIES[code] : undefined;
    const label = city || (code ? `Ukendt postnummer · ${code}` : 'Ikke oplyst');
    if (!places.has(label)) places.set(label, { label, count: 0, postalCodes: [] });
    const place = places.get(label)!;
    place.count++;
    if (code && !place.postalCodes.includes(code)) place.postalCodes.push(code);
  }
  return [...places.values()].map(place => ({ ...place, postalCodes: place.postalCodes.sort() }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, 'da'));
}
