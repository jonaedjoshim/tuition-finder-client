import { useCallback, useEffect, useRef, useState } from 'react';
import { getErrorMessage } from '../utils/helpers';

/**
 * Small data-fetching hook shared by pages.
 *
 * @param {() => Promise<any> | any} fetcher called on mount / deps change / reload()
 * @param {any[]} deps dependency list that re-runs the fetcher when it changes
 * @param {{ initialData?: any, immediate?: boolean }} options
 * @returns {{ data: any, loading: boolean, error: string | null, reload: () => void, setData: Function }}
 */
export function useApi(fetcher, deps = [], options = {}) {
  const { initialData = null, immediate = true } = options;

  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(Boolean(immediate));
  const [error, setError] = useState(null);
  const [nonce, setNonce] = useState(0);

  // Keep the latest fetcher without making it a dependency itself — callers
  // control re-fetching through `deps` and `reload()`.
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const reload = useCallback(() => setNonce((n) => n + 1), []);

  useEffect(() => {
    // With immediate=false, stay idle until reload() is called explicitly.
    if (!immediate && nonce === 0) return undefined;

    let cancelled = false;
    setLoading(true);
    setError(null);

    Promise.resolve()
      .then(() => fetcherRef.current())
      .then((result) => {
        if (!cancelled) setData(result);
      })
      .catch((err) => {
        if (!cancelled) setError(getErrorMessage(err));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, nonce, immediate]);

  return { data, loading, error, reload, setData };
}

export default useApi;
