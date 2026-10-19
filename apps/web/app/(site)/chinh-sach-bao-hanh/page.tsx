import { ContentPage, contentPageMetadata } from '@/components/ContentPage';

export const revalidate = 300;

export const metadata = contentPageMetadata('warranty');

export default function WarrantyPage() {
  return <ContentPage pageKey="warranty" />;
}
