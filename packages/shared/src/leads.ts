export const LEAD_CHANNELS = ['form', 'whatsapp', 'call', 'site-visit'] as const;
export type LeadChannel = (typeof LEAD_CHANNELS)[number];

export const LEAD_STAGES = ['new', 'contacted', 'site-visit', 'negotiation', 'won', 'lost'] as const;
export type LeadStage = (typeof LEAD_STAGES)[number];

export const SITE_VISIT_STATUSES = ['requested', 'confirmed', 'completed', 'cancelled', 'no-show'] as const;
export type SiteVisitStatus = (typeof SITE_VISIT_STATUSES)[number];

/** Manual UPI first (decision D6); a gateway can be added later. */
export const PAYMENT_METHODS = ['manual-upi'] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];
