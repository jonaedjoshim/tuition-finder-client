import { useEffect } from "react";

// Lightweight stand-in for AOS: reveal [data-reveal] elements as they enter the
// viewport. Protected pages mount their content only after the auth check, so
// a MutationObserver is needed to catch nodes added after this hook first ran.
export function useScrollReveal(dependency) {
  useEffect(() => {
    const handled = new WeakSet();

    const observer =
      typeof IntersectionObserver !== "undefined"
        ? new IntersectionObserver(
            (entries) => {
              entries.forEach((entry) => {
                if (!entry.isIntersecting) return;
                entry.target.classList.add("is-visible");
                handled.add(entry.target);
                observer.unobserve(entry.target);
              });
            },
            { threshold: 0.05, rootMargin: "0px 0px -40px 0px" },
          )
        : null;

    const watchPending = () => {
      document.querySelectorAll("[data-reveal]").forEach((node) => {
        if (handled.has(node) || node.classList.contains("is-visible")) return;
        if (!observer) {
          node.classList.add("is-visible");
          handled.add(node);
          return;
        }
        observer.observe(node);
      });
    };

    watchPending();

    const mutations =
      typeof MutationObserver !== "undefined"
        ? new MutationObserver(watchPending)
        : null;
    if (mutations) {
      mutations.observe(document.body, { childList: true, subtree: true });
    }

    return () => {
      observer?.disconnect();
      mutations?.disconnect();
    };
  }, [dependency]);
}

export default useScrollReveal;
