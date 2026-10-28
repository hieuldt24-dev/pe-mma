import { createContext, useContext, useState, type PropsWithChildren } from 'react';
import { currentMonth } from '@/utils/format';

const MonthContext = createContext<{ month: string; setMonth: (month: string) => void } | null>(
  null,
);
export function MonthProvider({ children }: PropsWithChildren) {
  const [month, setMonth] = useState(currentMonth);
  return <MonthContext.Provider value={{ month, setMonth }}>{children}</MonthContext.Provider>;
}
export function useMonth() {
  const value = useContext(MonthContext);
  if (!value) throw new Error('MonthProvider is missing');
  return value;
}
