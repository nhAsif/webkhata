import { useState, useMemo } from 'react';

export default function DataTable({
  columns,
  data,
  loading,
  searchPlaceholder = 'Search...',
  searchKeys = [],
  actions,
  emptyTitle = 'No data found',
  emptyDesc = '',
  emptyAction,
}) {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const perPage = 15;

  const filtered = useMemo(() => {
    if (!search || !searchKeys.length) return data;
    const q = search.toLowerCase();
    return data.filter((row) =>
      searchKeys.some((key) =>
        String(row[key] ?? '').toLowerCase().includes(q)
      )
    );
  }, [data, search, searchKeys]);

  const totalPages = Math.ceil(filtered.length / perPage);
  const paged = filtered.slice((page - 1) * perPage, page * perPage);

  const handleSearch = (e) => {
    setSearch(e.target.value);
    setPage(1);
  };

  if (loading) {
    return (
      <div className="table-wrapper">
        <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {[...Array(5)].map((_, i) => (
            <div key={i} className="skeleton skeleton-text" style={{ height: '40px' }} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="table-wrapper">
      <div className="table-toolbar">
        {searchKeys.length > 0 && (
          <div className="search-input-wrapper">
            <span className="search-icon">🔍</span>
            <input
              className="form-input search-input"
              placeholder={searchPlaceholder}
              value={search}
              onChange={handleSearch}
            />
          </div>
        )}
        <div style={{ flex: 1 }} />
        {actions}
      </div>

      {paged.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📭</div>
          <div className="empty-state-title">{emptyTitle}</div>
          {emptyDesc && <div className="empty-state-desc">{emptyDesc}</div>}
          {emptyAction}
        </div>
      ) : (
        <>
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  {columns.map((col) => (
                    <th key={col.key}>{col.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paged.map((row, i) => (
                  <tr key={row.id ?? i}>
                    {columns.map((col) => (
                      <td key={col.key}>
                        {col.render ? col.render(row) : row[col.key]}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="pagination">
              <button
                className="page-btn"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                ‹
              </button>
              {[...Array(totalPages)].map((_, i) => (
                <button
                  key={i}
                  className={`page-btn ${page === i + 1 ? 'active' : ''}`}
                  onClick={() => setPage(i + 1)}
                >
                  {i + 1}
                </button>
              ))}
              <button
                className="page-btn"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                ›
              </button>
              <span className="text-xs text-muted" style={{ marginLeft: '0.5rem' }}>
                {filtered.length} total
              </span>
            </div>
          )}
        </>
      )}
    </div>
  );
}
