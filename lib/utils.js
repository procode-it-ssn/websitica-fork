import { clsx } from "clsx";
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

// PostgREST renders .eq("lab", null) as `lab=eq.null`, which compares against
// the literal and never matches a NULL row. Unassigned labs need `is.null`.
export function whereLab(query, lab) {
  return lab === null || lab === undefined
    ? query.is("lab", null)
    : query.eq("lab", lab);
}
