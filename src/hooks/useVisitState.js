import { createContext, useContext, useLayoutEffect, useState } from 'react';

export const VisitContext = createContext(null);
const visits = new Map();

export function getVisit(key) {
  const visit = visits.get(key) || new Map();
  visits.delete(key);
  visits.set(key, visit);
  if (visits.size > 30) visits.delete(visits.keys().next().value);
  return visit;
}

export function useVisitState(name, initial) {
  const visit = useContext(VisitContext);
  const [value, setValue] = useState(() => visit?.has(name) ? visit.get(name) : initial);
  useLayoutEffect(() => { visit?.set(name, value); }, [visit, name, value]);
  return [value, setValue];
}
