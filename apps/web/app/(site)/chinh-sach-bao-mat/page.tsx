import { ContentPage, contentPageMetadata } from '@/components/ContentPage';

export const revalidate = 300;

export const metadata = contentPageMetadata('privacy');

export default function PrivacyPage() {
  return <ContentPage pageKey="privacy" />;
}
