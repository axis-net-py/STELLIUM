import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useState } from 'react';

interface CalendarProps {
  mode?: 'single' | 'range';
  selected?: Date | { from?: Date; to?: Date };
  onSelect?: (date: any) => void;
  numberOfMonths?: number;
  className?: string;
}

export function Calendar({
  mode = 'single',
  selected,
  onSelect,
  numberOfMonths = 1,
  className,
}: CalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const daysInMonth = new Date(
    currentMonth.getFullYear(),
    currentMonth.getMonth() + 1,
    0
  ).getDate();

  const firstDayOfMonth = new Date(
    currentMonth.getFullYear(),
    currentMonth.getMonth(),
    1
  ).getDay();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  const handleDateClick = (day: number) => {
    const date = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth(),
      day
    );
    if (onSelect) {
      if (mode === 'range') {
        const current = selected as { from?: Date; to?: Date };
        if (!current?.from || (current.from && current.to)) {
          onSelect({ from: date, to: undefined });
        } else {
          onSelect({ from: current.from, to: date });
        }
      } else {
        onSelect(date);
      }
    }
  };

  const isSelected = (day: number) => {
    const date = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth(),
      day
    );
    if (mode === 'range') {
      const range = selected as { from?: Date; to?: Date };
      return (
        (range?.from && date.toDateString() === range.from.toDateString()) ||
        (range?.to && date.toDateString() === range.to.toDateString())
      );
    }
    return selected && date.toDateString() === (selected as Date).toDateString();
  };

  const days = [];
  for (let i = 0; i < firstDayOfMonth; i++) {
    days.push(<div key={`empty-${i}`} className="w-8 h-8" />);
  }
  for (let day = 1; day <= daysInMonth; day++) {
    days.push(
      <button
        key={day}
        onClick={() => handleDateClick(day)}
        className={cn(
          'w-8 h-8 text-sm rounded-md hover:bg-muted transition-colors',
          isSelected(day) && 'bg-primary text-primary-foreground'
        )}
      >
        {day}
      </button>
    );
  }

  return (
    <div className={cn('p-3', className)}>
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() =>
            setCurrentMonth(
              new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1)
            )
          }
          className="p-1 hover:bg-muted rounded"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="text-sm font-medium">
          {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
        </span>
        <button
          onClick={() =>
            setCurrentMonth(
              new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1)
            )
          }
          className="p-1 hover:bg-muted rounded"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1 mb-2">
        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d) => (
          <div key={d} className="w-8 h-8 text-xs text-muted-foreground flex items-center justify-center">
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">{days}</div>
    </div>
  );
}
