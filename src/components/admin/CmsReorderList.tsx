import { useState, type ReactNode } from 'react';
import { GripVertical } from 'lucide-react';

type Props<T> = {
  items: T[];
  onReorder: (from: number, to: number) => void;
  keyFn: (item: T, index: number) => string;
  renderItem: (item: T, index: number) => ReactNode;
  className?: string;
};

export default function CmsReorderList<T>({ items, onReorder, keyFn, renderItem, className }: Props<T>) {
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);

  const finish = (from: number, to: number) => {
    setDragIndex(null);
    setOverIndex(null);
    if (from === to) return;
    onReorder(from, to);
  };

  return (
    <ul className={className ?? 'space-y-3'}>
      {items.map((item, index) => (
        <li
          key={keyFn(item, index)}
          draggable
          onDragStart={() => setDragIndex(index)}
          onDragOver={(e) => {
            e.preventDefault();
            setOverIndex(index);
          }}
          onDrop={(e) => {
            e.preventDefault();
            if (dragIndex === null) return;
            finish(dragIndex, index);
          }}
          onDragEnd={() => {
            setDragIndex(null);
            setOverIndex(null);
          }}
          className={[
            'flex gap-2 rounded-xl border dash-border transition-shadow',
            dragIndex === index ? 'opacity-50' : '',
            overIndex === index && dragIndex !== null && dragIndex !== index
              ? 'ring-2 ring-kado-red/40 shadow-md'
              : '',
          ].join(' ')}
        >
          <div
            className="flex shrink-0 cursor-grab items-start px-2 py-4 text-[var(--color-dash-text-muted)] active:cursor-grabbing"
            aria-hidden
          >
            <GripVertical className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1 py-3 pr-3">{renderItem(item, index)}</div>
        </li>
      ))}
    </ul>
  );
}
