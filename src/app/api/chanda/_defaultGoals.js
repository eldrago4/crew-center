export const GOALS_REDIS_KEY = 'chanda:goals:config';

export const DEFAULT_GOALS = [
  {
    id:          'domain',
    label:       'Web Domain',
    title:       'indianvirtual.site',
    description: 'Annual renewal of our domain — the address every pilot types to reach home.',
    target:      3600,
    color:       '#6366f1',
    gradient:    'linear-gradient(to right, #6366f1, #8b5cf6)',
    icon:        'globe',
  },
  {
    id:          'database',
    label:       'Crew Records',
    title:       'Flight Data Storage',
    description: 'Every PIREP, rank, flight log, and crew record lives here. Zero downtime is the standard.',
    target:      1680,
    color:       '#0ea5e9',
    gradient:    'linear-gradient(to right, #0ea5e9, #38bdf8)',
    icon:        'database',
  },
  {
    id:          'bot',
    label:       'Automation Server',
    title:       'Discord Bot VPS',
    description: 'The 24/7 server running rank promotions, ticket systems, and live alerts for your flights.',
    target:      7200,
    color:       '#10b981',
    gradient:    'linear-gradient(to right, #10b981, #34d399)',
    icon:        'cpu',
  },
];
