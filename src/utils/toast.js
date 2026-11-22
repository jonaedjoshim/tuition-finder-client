import toast from 'react-hot-toast';

// Shared toast styling so success/error feedback looks the same everywhere.
const toastOptions = {
  duration: 3500,
  style: {
    background: '#FFFFFF',
    color: '#1A1F36',
    border: '1px solid #E5E7EB',
    borderRadius: '12px',
    fontFamily: 'Inter, sans-serif',
    fontSize: '14px',
    fontWeight: 500,
    boxShadow: '0 10px 30px rgba(26, 31, 54, 0.12)',
  },
  success: { iconTheme: { primary: '#2D5BE3', secondary: '#FFFFFF' } },
  error: { iconTheme: { primary: '#DC2626', secondary: '#FFFFFF' } },
};

export function notifySuccess(msg) {
  return toast.success(msg, toastOptions);
}

export function notifyError(msg) {
  return toast.error(msg, toastOptions);
}
