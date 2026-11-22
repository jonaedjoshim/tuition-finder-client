import * as Fi from "react-icons/fi";

// One small, consistent icon language. Keys are the old emoji literals so the
// migration stays readable; new code should use the keys directly.
const ICONS = {
  bookOpen: Fi.FiBookOpen,
  book: Fi.FiBook,
  ruler: Fi.FiPenTool,
  activity: Fi.FiActivity,
  code: Fi.FiCode,
  barChart: Fi.FiBarChart2,
  globe: Fi.FiGlobe,
  penTool: Fi.FiPenTool,
  layers: Fi.FiLayers,
  search: Fi.FiSearch,
  user: Fi.FiUser,
  users: Fi.FiUsers,
  calendar: Fi.FiCalendar,
  trendingUp: Fi.FiTrendingUp,
  star: Fi.FiStar,
  check: Fi.FiCheck,
  checkCircle: Fi.FiCheckCircle,
  alert: Fi.FiAlertCircle,
  info: Fi.FiInfo,
  file: Fi.FiFileText,
  message: Fi.FiMessageSquare,
  inbox: Fi.FiInbox,
  bell: Fi.FiBell,
  pin: Fi.FiMapPin,
  money: Fi.FiDollarSign,
  clock: Fi.FiClock,
  home: Fi.FiHome,
  logout: Fi.FiLogOut,
  lock: Fi.FiLock,
  mail: Fi.FiMail,
  smile: Fi.FiSmile,
  meh: Fi.FiMeh,
  briefcase: Fi.FiBriefcase,
  clipboard: Fi.FiClipboard,
  flag: Fi.FiFlag,
  settings: Fi.FiSettings,
  link: Fi.FiLink,
  target: Fi.FiTarget,
  zap: Fi.FiZap,
  eye: Fi.FiEye,
  eyeOff: Fi.FiEyeOff,
  facebook: Fi.FiFacebook,
  twitter: Fi.FiTwitter,
  instagram: Fi.FiInstagram,
  youtube: Fi.FiYoutube,
  heart: Fi.FiHeart,
  sliders: Fi.FiSliders,
  grid: Fi.FiGrid,
  plus: Fi.FiPlus,
  close: Fi.FiX,
  chevronDown: Fi.FiChevronDown,
  chevronLeft: Fi.FiChevronLeft,
  chevronRight: Fi.FiChevronRight,
  arrowRight: Fi.FiArrowRight,
  send: Fi.FiSend,
  shield: Fi.FiShield,
  award: Fi.FiAward,
  refresh: Fi.FiRefreshCw,
};

export function Icon({
  name,
  size = "1em",
  className = "",
  strokeWidth = 1.7,
  ...props
}) {
  const Component = ICONS[name] || Fi.FiCircle;
  return (
    <Component
      size={size}
      strokeWidth={strokeWidth}
      className={className}
      aria-hidden="true"
      {...props}
    />
  );
}

export default Icon;
