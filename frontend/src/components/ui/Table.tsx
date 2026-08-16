import type { ReactNode } from 'react';

export interface Column<T = any> {
  header: ReactNode;
  accessor?: keyof T | string | ((row: T) => ReactNode);
  cell?: (row: T, index: number) => ReactNode;
  render?: (row: T, index: number) => ReactNode;
  key?: string;
  align?: 'left' | 'center' | 'right';
  className?: string;
  headerClassName?: string;
  width?: string;
}

export interface TableProps<T = any> {
  columns: Column<T>[];
  data?: T[];
  keyExtractor?: (row: T, index: number) => string | number;
  onRowClick?: (row: T, index: number) => void;
  emptyState?: ReactNode;
  isLoading?: boolean;
  className?: string;
  headerClassName?: string;
  rowClassName?: string | ((row: T, index: number) => string);
  striped?: boolean;
  hoverable?: boolean;
}

export function Table<T = any>({
  columns,
  data = [],
  keyExtractor,
  onRowClick,
  emptyState,
  isLoading = false,
  className = '',
  headerClassName = '',
  rowClassName = '',
  striped = false,
  hoverable = true,
}: TableProps<T>) {
  const getAlignmentClass = (align?: 'left' | 'center' | 'right') => {
    switch (align) {
      case 'center':
        return 'text-center';
      case 'right':
        return 'text-right';
      case 'left':
      default:
        return 'text-left';
    }
  };

  const renderCellContent = (row: T, col: Column<T>, index: number): ReactNode => {
    if (col.cell) {
      return col.cell(row, index);
    }

    if (col.render) {
      return col.render(row, index);
    }

    if (typeof col.accessor === 'function') {
      return col.accessor(row);
    }

    if (col.accessor && typeof col.accessor === 'string' && typeof row === 'object' && row !== null) {
      return ((row as Record<string, any>)[col.accessor] as ReactNode) ?? null;
    }
    return null;
  };

  const getRowKey = (row: T, index: number): string | number => {
    if (keyExtractor) {
      return keyExtractor(row, index);
    }
    if (typeof row === 'object' && row !== null) {
      const anyRow = row as Record<string, any>;
      return anyRow.id ?? anyRow._id ?? anyRow.key ?? index;
    }
    return index;
  };

  const getColumnKey = (col: Column<T>, colIndex: number): string => {
    if (col.key) return col.key;
    if (typeof col.accessor === 'string') return col.accessor;
    if (typeof col.header === 'string') return col.header;
    return `col-${colIndex}`;
  };

  return (
    <div className={`w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs ${className}`}>
      <div className='overflow-x-auto'>
        <table className='w-full border-collapse text-left text-xs'>
          <thead className={`bg-slate-50/80 border-b border-slate-200 select-none ${headerClassName}`}>
            <tr>
              {columns.map((col, colIdx) => (
                <th
                  key={getColumnKey(col, colIdx)}
                  style={col.width ? { width: col.width } : undefined}
                  className={`
                    px-4 py-3.5 text-[11px] font-bold uppercase tracking-wider text-slate-500
                    ${getAlignmentClass(col.align)}
                    ${col.headerClassName || ''}
                  `}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>

          <tbody className='divide-y divide-slate-100'>
            {isLoading ? (
              <tr>
                <td colSpan={columns.length} className='px-4 py-12 text-center'>
                  <div className='flex flex-col items-center justify-center gap-2.5'>
                    <div className='w-6 h-6 border-2 border-[#D12026] border-t-transparent rounded-full animate-spin' />
                    <span className='text-xs font-semibold text-slate-400'>Loading data...</span>
                  </div>
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className='px-4 py-12 text-center'>
                  {emptyState || (
                    <div className='flex flex-col items-center justify-center text-slate-400 py-4'>
                      <p className='text-xs font-medium'>No records found</p>
                    </div>
                  )}
                </td>
              </tr>
            ) : (
              data.map((row, idx) => {
                const rowKey = getRowKey(row, idx);
                const customRowClass =
                  typeof rowClassName === 'function' ? rowClassName(row, idx) : rowClassName;

                return (
                  <tr
                    key={rowKey}
                    onClick={() => onRowClick?.(row, idx)}
                    className={`
                      transition-colors duration-150
                      ${striped && idx % 2 === 1 ? 'bg-slate-50/40' : 'bg-white'}
                      ${hoverable ? 'hover:bg-rose-50/30' : ''}
                      ${onRowClick ? 'cursor-pointer' : ''}
                      ${customRowClass}
                    `}
                  >
                    {columns.map((col, colIdx) => (
                      <td
                        key={`${rowKey}-${getColumnKey(col, colIdx)}`}
                        className={`
                          px-4 py-3.5 text-slate-700 font-normal align-middle
                          ${getAlignmentClass(col.align)}
                          ${col.className || ''}
                        `}
                      >
                        {renderCellContent(row, col, idx)}
                      </td>
                    ))}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Table;
