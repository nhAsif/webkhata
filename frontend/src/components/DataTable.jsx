import { useState, useMemo } from 'react';
import { Input } from './Input';
import Button from './Button';
import { Search, Inbox, ChevronLeft, ChevronRight } from 'lucide-react';

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
      <div className="rounded-none bg-white overflow-hidden p-6 space-y-4 border-4 border-black shadow-[8px_8px_0px_0px_var(--neo-shadow)]">
        {[...Array(5)].map((_, i) => (
          <div 
            key={i} 
            className="h-10 bg-[#C4B5FD]/20 border-2 border-black animate-pulse w-full"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="w-full max-w-full rounded-none bg-white overflow-hidden font-body border-4 border-black shadow-[8px_8px_0px_0px_var(--neo-shadow)]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 border-b-4 border-black bg-[#FFD93D]/10">
        {searchKeys.length > 0 && (
          <div className="relative w-full sm:max-w-xs">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-black">
              <Search className="w-4 h-4 stroke-[3px]" />
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

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 px-6 text-center bg-white">
          <div className="text-black mb-3">
            <Inbox className="w-12 h-12 stroke-[2px]" />
          </div>
          <div className="text-xl font-heading font-black text-black uppercase tracking-tight">{emptyTitle}</div>
          {emptyDesc && <div className="text-sm text-black/70 font-bold mt-1.5 max-w-sm">{emptyDesc}</div>}
          {emptyAction && <div className="mt-4">{emptyAction}</div>}
        </div>
      ) : (
        <>
          <div className="w-full overflow-x-auto bg-white">
            <table className="w-full text-left border-collapse whitespace-nowrap">
              <thead>
                <tr className="bg-[#C4B5FD] border-b-4 border-black">
                  {columns.map((col) => (
                    <th 
                      key={col.key}
                      className={`px-6 py-4 text-[13px] font-black tracking-widest text-black uppercase font-heading border-r-2 last:border-r-0 border-black ${col.className || ''}`}
                    >
                      {col.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y-2 divide-black">
                {paged.map((row, i) => (
                  <tr 
                    key={row.id ?? i}
                    className="hover:bg-[#FFD93D]/10 transition-all duration-100 group"
                  >
                    {columns.map((col) => (
                      <td key={col.key} className={`px-6 py-4 text-sm text-black font-bold border-r-2 last:border-r-0 border-black ${col.className || ''}`}>
                        {col.render ? col.render(row) : row[col.key]}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 border-t-4 border-black bg-[#C4B5FD]/10">
              <span className="text-xs text-black font-bold font-mono">
                Showing {((page - 1) * perPage) + 1} to {Math.min(page * perPage, filtered.length)} of {filtered.length} entries
              </span>
              <div className="flex items-center">
                <Button
                  variant="outline"
                  size="xs"
                  className="border-r-0"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  <ChevronLeft className="w-4 h-4 stroke-[3px]" />
                </Button>
                {[...Array(totalPages)].map((_, i) => {
                  const isActive = page === i + 1;
                  return (
                    <Button
                      key={i}
                      variant={isActive ? 'primary' : 'outline'}
                      size="xs"
                      className={`border-r-0 last:border-r-4`}
                      onClick={() => setPage(i + 1)}
                    >
                      {i + 1}
                    </Button>
                  );
                })}
                <Button
                  variant="outline"
                  size="xs"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  <ChevronRight className="w-4 h-4 stroke-[3px]" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
