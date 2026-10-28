// Cache tags the server console can refresh, grouped the way they show up on the
// site. Every tag here is assigned by a cacheTag() somewhere; refreshing marks it
// stale and the data reloads on the next visit that needs it.
export const CACHE_GROUPS = [
    { id: 'routes', label: 'Routes', tags: ['routes'] },
    { id: 'pireps', label: 'PIREP statistics', tags: ['pireps'] },
    { id: 'dashboard', label: 'NOTAMs & events', tags: ['notams', 'events', 'crewcenter-events'] },
    {
        id: 'fleet',
        label: 'Fleet, operators & multipliers',
        tags: ['crewcenter-fleet', 'crewcenter-operators', 'crewcenter-multipliers', 'crewcenter-ifatcMultipliers'],
    },
];
