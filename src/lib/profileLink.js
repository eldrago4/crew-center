// The canonical, publicly shareable pilot-profile URL.
//
// Deliberately NOT derived from window.location.origin: the crew app is served
// from its own host in some deployments, and the auth-gated /crew/team/{callsign}
// page is useless to anyone who isn't signed in. A shared link must always point
// at the public /team/{callsign} page on the public domain, whichever page the
// share button was pressed from.
export const PUBLIC_ORIGIN = 'https://indianvirtual.com'

export function profileShareUrl(callsign) {
  return `${PUBLIC_ORIGIN}/team/${String(callsign || '').toUpperCase()}`
}
