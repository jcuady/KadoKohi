import { useSearchParams } from 'react-router-dom';
import HomePageContent from '../components/home/HomePageContent';
import { useLandingPageContent } from '../hooks/useLandingPageContent';

export default function Home() {
  const landing = useLandingPageContent();
  const [searchParams] = useSearchParams();
  const showPreviewBanner = searchParams.get('preview') === '1';

  return <HomePageContent landing={landing} previewBanner={showPreviewBanner} />;
}
