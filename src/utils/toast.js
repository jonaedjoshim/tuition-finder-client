import toast from "react-hot-toast";

// Shared toast styling. CSS variables keep feedback readable in both themes.
const toastOptions = {
  duration: 3500,
  style: {
    background: "rgb(var(--surface))",
    color: "rgb(var(--ink))",
    border: "1px solid rgb(var(--line))",
    borderRadius: "12px",
    fontFamily: "DM Sans, sans-serif",
    fontSize: "14px",
    fontWeight: 500,
    boxShadow: "0 12px 32px rgb(var(--ink) / 0.12)",
  },
  success: {
    iconTheme: {
      primary: "rgb(var(--brand))",
      secondary: "rgb(var(--surface))",
    },
  },
  error: {
    iconTheme: {
      primary: "rgb(var(--danger))",
      secondary: "rgb(var(--surface))",
    },
  },
};

export function notifySuccess(msg) {
  return toast.success(msg, toastOptions);
}

export function notifyError(msg) {
  return toast.error(msg, toastOptions);
}
