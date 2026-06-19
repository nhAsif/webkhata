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
      <div className="rounded-none border-4 border-black bg-white overflow-hidden p-6 space-y-4 shadow-[6px_6px_0px_0px_#121212]">
        {[...Array(5)].map((_, i) => (
          <div 
            key={i} 
            className="h-10 bg-gray-100 rounded-none border border-black/10 animate-pulse w-full"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="w-full max-w-full rounded-none border-4 border-black bg-white overflow-hidden font-body shadow-[6px_6px_0px_0px_#121212] text-[#121212]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 border-b-4 border-black bg-[#F0F0F0]">
        {searchKeys.length > 0 && (
          <div className="relative w-full sm:max-w-xs">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-[#121212] text-sm">
              🔍
            </span>
            <Input
              type="text"
              className="pl-9 h-10 w-full rounded-none"
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
          <div className="text-lg font-heading font-black uppercase tracking-tighter text-[#121212]">{emptyTitle}</div>
          {emptyDesc && <div className="text-xs font-semibold text-gray-500 mt-1 max-w-sm uppercase tracking-wider font-mono">{emptyDesc}</div>}
          {emptyAction && <div className="mt-4">{emptyAction}</div>}
        </div>
      ) : (
        <>
          <div className="w-full overflow-x-auto">
            <table className="w-full text-left border-collapse whitespace-nowrap">
              <thead>
                <tr className="bg-[#F0C020] border-b-4 border-black text-[#121212]">
                  {columns.map((col) => (
                    <th 
                      key={col.key}
                      className={`px-6 py-4 text-xs font-black tracking-widest text-[#121212] uppercase font-mono ${col.className || ''}`}
                    >
                      {col.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-black/10">
                {paged.map((row, i) => (
                  <tr 
                    key={row.id ?? i}
                    className="hover:bg-[#1040C0]/5 transition-all duration-150 group"
                  >
                    {columns.map((col) => (
                      <td key={col.key} className={`px-6 py-4 text-sm text-[#121212] font-medium ${col.className || ''}`}>
                        {col.render ? col.render(row) : row[col.key]}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 border-t-4 border-black bg-[#F0F0F0]">
              <span className="text-xs text-gray-600 font-mono font-semibold uppercase tracking-wider">
                Showing {((page - 1) * perPage) + 1} to {Math.min(page * perPage, filtered.length)} of {filtered.length} entries
              </span>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 w-8 p-0 rounded-none flex items-center justify-center border-black"
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
                      className={`h-8 min-w-[32px] px-1.5 rounded-none flex items-center justify-center ${
                        isActive 
                          ? '' 
                          : 'border-black text-[#121212] hover:bg-gray-100'
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
                  className="h-8 w-8 p-0 rounded-none flex items-center justify-center border-black"
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
