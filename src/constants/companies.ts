export const COMPANIES = ['BHP', 'Hatch', 'Bantrel', 'Fluor'] as const

export type Company = (typeof COMPANIES)[number]

/** BHP can view requests from every company; others only their own. */
export function canViewCompany(viewerCompany: Company | undefined | null, requestCompany: Company | string): boolean {
  if (!viewerCompany) return false
  if (viewerCompany === 'BHP') return true
  return viewerCompany === requestCompany
}

export function filterByCompanyVisibility<T extends { company: string }>(
  items: T[],
  viewerCompany: Company | undefined | null,
): T[] {
  if (!viewerCompany) return []
  if (viewerCompany === 'BHP') return items
  return items.filter((item) => item.company === viewerCompany)
}

/** Hatch/Bantrel use JS1; Fluor uses JS2; BHP defaults to JS1. */
export function defaultPhaseForCompany(company: Company | '' | undefined | null): 'JS1' | 'JS2' {
  if (company === 'Fluor') return 'JS2'
  return 'JS1'
}
