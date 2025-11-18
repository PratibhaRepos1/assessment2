import React, { createContext, useCallback, useContext, useState } from 'react';

const DataContext = createContext();

export function DataProvider({ children }) {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);

  // fetchItems accepts either an AbortSignal or an options object: { signal, page, limit, q }
  const fetchItems = useCallback(async (arg) => {
    let signal;
    let page = 1;
    let limit = 20;
    let q = '';

    if (arg && typeof arg === 'object') {
      // If the caller passed an object with params
      if ('signal' in arg || 'page' in arg || 'limit' in arg || 'q' in arg) {
        signal = arg.signal;
        page = arg.page ?? page;
        limit = arg.limit ?? limit;
        q = arg.q ?? q;
      } else if (arg.aborted !== undefined) {
        // Caller passed an AbortSignal directly
        signal = arg;
      }
    }

    try {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('limit', String(limit));
      if (q) params.set('q', q);

      const url = `http://localhost:4001/api/items?${params.toString()}`;
      // Debug: log request URL so browser console/network errors are easier to trace
      // (Visible in browser devtools when this code runs in the client)
      // eslint-disable-next-line no-console
      console.debug('[fetchItems] fetching', url);
      const res = await fetch(url, { signal });
      if (!res.ok) throw new Error('Network response was not ok');
      const json = await res.json();

      if (!signal || !signal.aborted) {
        // Server returns { items, total, page, limit }
        if (Array.isArray(json)) {
          setItems(json);
          setTotal(json.length);
        } else {
          setItems(json.items || []);
          setTotal(json.total || 0);
        }
      }

      return json;
    } catch (err) {
      if (err && err.name === 'AbortError') return;
      // Provide more context for network failures in the client console
      // eslint-disable-next-line no-console
      console.error('[fetchItems] failed fetching', { url: `http://localhost:4001/api/items?${params.toString()}`, err });
      throw err;
    }
  }, []);

  return (
    <DataContext.Provider value={{ items, total, fetchItems }}>
      {children}
    </DataContext.Provider>
  );
}

export const useData = () => useContext(DataContext);