import { Suspense } from 'react';
import SoulSearchApp from '@/components/soul-search-app';
export const metadata = { title: 'Søg i sjælen · Sjælen af Karneval' };
export default function SearchPage() {
  return <Suspense fallback={<p role="status">Åbner Sjælen …</p>}><SoulSearchApp /></Suspense>;
}
