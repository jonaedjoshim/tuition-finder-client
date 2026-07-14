import { Link } from 'react-router-dom';

export default function Footer() {
  const cols = [
    {
      title: 'For Students',
      links: [
        { label: 'Find a Tutor', to: '/tutors' },
        { label: 'Post Tuition', to: '/post-tuition' },
        { label: 'Browse Subjects', to: '/tutors?cat=all' },
        { label: 'How It Works', to: '/#how' },
      ],
    },
    {
      title: 'For Tutors',
      links: [
        { label: 'Register as Tutor', to: '/register?role=tutor' },
        { label: 'Browse Jobs', to: '/tutors/jobs' },
        { label: 'Tutor Dashboard', to: '/tutor/dashboard' },
        { label: 'Earning Guide', to: '#' },
      ],
    },
    {
      title: 'Support',
      links: [
        { label: 'Help Center', to: '#' },
        { label: 'Contact Us', to: '#' },
        { label: 'Privacy Policy', to: '#' },
        { label: 'Terms of Service', to: '#' },
      ],
    },
  ];

  return (
    <footer className="bg-[#1A1F36] text-white/70 pt-16 pb-8">
      <div className="container max-w-[1200px] mx-auto px-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-[2fr_1fr_1fr_1fr] gap-10 mb-12">
          {/* Brand */}
          <div>
            <Link to="/" className="flex items-center gap-2.5 no-underline mb-4">
              <div className="w-9 h-9 rounded-[10px] bg-gradient-to-br from-royal to-violet flex items-center justify-center text-lg">🎓</div>
              <span className="font-sora font-bold text-lg text-white">TuitionFinder</span>
            </Link>
            <p className="text-sm leading-relaxed text-white/55 max-w-[280px]">
              Bangladesh's most trusted platform connecting students with verified expert tutors — online or in-person.
            </p>
            <div className="flex gap-2.5 mt-5">
              {['📘', '🐦', '📸', '▶️'].map((icon, i) => (
                <button
                  key={i}
                  className="w-[38px] h-[38px] rounded-[10px] border border-white/15 bg-white/[0.07] cursor-pointer text-[15px] flex items-center justify-center transition-colors hover:bg-royal/40"
                >
                  {icon}
                </button>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {cols.map((col) => (
            <div key={col.title}>
              <h4 className="font-sora font-bold text-sm text-white mb-4 uppercase tracking-wide">{col.title}</h4>
              <div className="flex flex-col gap-2.5">
                {col.links.map((l) => (
                  <Link key={l.label} to={l.to} className="text-sm text-white/55 no-underline transition-colors hover:text-white">
                    {l.label}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/10 pt-6 flex flex-wrap items-center justify-between gap-3">
          <p className="text-[13px]">© 2024 TuitionFinder. Made with ❤️ in Bangladesh.</p>
          <div className="flex gap-6">
            {['Privacy', 'Terms', 'Cookies'].map((t) => (
              <a key={t} href="#" className="text-[13px] text-white/45 no-underline transition-colors hover:text-white">
                {t}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
