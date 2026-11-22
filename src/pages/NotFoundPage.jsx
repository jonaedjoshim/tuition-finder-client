import { Link } from 'react-router-dom';
import Navbar from '../components/common/Navbar';
import { Button } from '../components/ui';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-[#FDFBF7] pt-[68px]">
      <Navbar />
      <div className="container max-w-[1200px] mx-auto px-6 py-24 flex flex-col items-center text-center">
        <div className="text-7xl mb-6">🎓</div>
        <p className="text-sm font-bold text-royal tracking-[0.2em] mb-2">404</p>
        <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 font-sora mb-3">
          Oops! We couldn&apos;t find that page.
        </h1>
        <p className="text-sm text-gray-500 max-w-md leading-relaxed mb-8">
          The page you&apos;re looking for may have moved or doesn&apos;t exist.
          Let&apos;s get you back on track.
        </p>
        <Link to="/" className="no-underline">
          <Button>🏠 Back to Home</Button>
        </Link>
      </div>
    </div>
  );
}
