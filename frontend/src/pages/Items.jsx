import React, { useEffect, useState, useCallback } from 'react';
import { useData } from '../state/DataContext';
import { Link } from 'react-router-dom';
import { FixedSizeList as List } from 'react-window';
import './Items.css';

function Items() {
  const { items, total, fetchItems } = useData();

  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [appliedQuery, setAppliedQuery] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);

    fetchItems({ signal: controller.signal, page, limit, q: appliedQuery })
      .then(() => setLoading(false))
      .catch(err => {
        if (err.name !== 'AbortError') console.error(err);
        setLoading(false);
      });

    return () => {
      controller.abort();
    };
  }, [fetchItems, page, limit, appliedQuery]);

  const onSearch = (e) => {
    e.preventDefault();
    setPage(1);
    setAppliedQuery(searchTerm.trim());
  };

  const hasMore = page * limit < total;

  return (
    <main>
      <form onSubmit={onSearch} className="page-controls" aria-label="Search items">
        <label htmlFor="items-search" className="visually-hidden">Search items</label>
        <input
          id="items-search"
          className="search-input"
          placeholder="Search items..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          aria-label="Search items"
        />
        <button className="button" type="submit" aria-label="Apply search">Search</button>
      </form>

      {loading && (
        <div className="list-viewport">
          <div className="skeleton-list" aria-live="polite">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="skeleton" style={{ width: '100%' }} />
            ))}
          </div>
        </div>
      )}

      {!loading && items.length === 0 && <p>No items found.</p>}

      {!loading && items.length > 0 && (
        <div className="list-viewport" role="region" aria-label="Items list">
          <List
            height={400}
            itemCount={items.length}
            itemSize={50}
            width="100%"
            role="list"
          >
            {({ index, style }) => {
              const item = items[index];
              return (
                <div
                  role="listitem"
                  aria-setsize={items.length}
                  aria-posinset={index + 1}
                  style={{ ...style }}
                  className="list-item"
                  key={item.id}
                >
                  <Link className="item-name" to={'/items/' + item.id}>{item.name}</Link>
                  <span className="item-meta">{item.category} • ${item.price}</span>
                </div>
              );
            }}
          </List>
        </div>
      )}

      <div style={{ marginTop: 12 }}>
        <button className="button" type="button" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1} aria-label="Previous page">
          Prev
        </button>
        <span style={{ margin: '0 8px' }} aria-live="polite">Page {page}</span>
        <button className="button" type="button" onClick={() => setPage(p => p + 1)} disabled={!hasMore} aria-label="Next page">
          Next
        </button>
        <span style={{ marginLeft: 12 }}>Total: {total}</span>
      </div>
    </main>
  );
}

export default Items;