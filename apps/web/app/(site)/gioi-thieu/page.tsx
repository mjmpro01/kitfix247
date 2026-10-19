import { ContentPage, contentPageMetadata } from '@/components/ContentPage';

export const revalidate = 300;

export const metadata = contentPageMetadata('about');

export default function AboutPage() {
  return <ContentPage pageKey="about" />;
}
