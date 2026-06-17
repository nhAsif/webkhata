import { useState, useMemo } from 'react';
import { Input } from './Input';
import Button from './Button';

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
      <div className="rounded-2xl border border-white/10 bg-matter overflow-hidden p-6 space-y-4">
        {[...Array(5)].map((_, i) => (
          <div 
            key={i} 
            className="h-10 bg-white/5 rounded-lg border border-white/5 animate-pulse w-full"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-matter overflow-hidden font-body">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 border-b border-white/10">
        {searchKeys.length > 0 && (
          <div className="relative w-full sm:max-w-xs">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-stardust text-sm">
              🔍
            </span>
            <Input
              type="text"
              className="pl-9 h-10 w-full"
              placeholder={searchPlaceholder}
              value={search}
              onChange={handleSearch}
            />
          </div>
        )}
        <div className="flex-1" />
        <div className="flex items-center gap-2">{actions}</div>
      </div>

      {paged.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
          <div className="text-4xl mb-3">📭</div>
          <div className="text-lg font-heading font-semibold text-pure">{emptyTitle}</div>
          {emptyDesc && <div className="text-sm text-stardust mt-1 max-w-sm">{emptyDesc}</div>}
          {emptyAction && <div className="mt-4">{emptyAction}</div>}
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-void/50 border-b border-white/10">
                  {columns.map((col) => (
                    <th 
                      key={col.key}
                      className="px-6 py-4 text-xs font-semibold tracking-wider text-stardust uppercase font-mono"
                    >
                      {col.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {paged.map((row, i) => (
                  <tr 
                    key={row.id ?? i}
                    className="hover:bg-white/5 transition-all duration-150 group"
                  >
                    {columns.map((col) => (
                      <td key={col.key} className="px-6 py-4 text-sm text-pure/90">
                        {col.render ? col.render(row) : row[col.key]}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-white/10 bg-void/30">
              <span className="text-xs text-stardust font-mono">
                Showing {((page - 1) * perPage) + 1} to {Math.min(page * perPage, filtered.length)} of {filtered.length} entries
              </span>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 w-8 p-0 rounded-lg flex items-center justify-center border-white/10 hover:border-bitcoin/50"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  ‹
                </Button>
                {[...Array(totalPages)].map((_, i) => {
                  const isActive = page === i + 1;
                  return (
                    <Button
                      key={i}
                      variant={isActive ? 'primary' : 'outline'}
                      size="sm"
                      className={`h-8 min-w-[32px] px-1.5 rounded-lg flex items-center justify-center ${
                        isActive 
                          ? '' 
                          : 'border-white/10 hover:border-bitcoin/30 text-pure hover:bg-white/5'
                      }`}
                      onClick={() => setPage(i + 1)}
                    >
                      {i + 1}
                    </Button>
                  );
                })}
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 w-8 p-0 rounded-lg flex items-center justify-center border-white/10 hover:border-bitcoin/50"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  ›
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
