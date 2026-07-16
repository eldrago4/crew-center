// Shared by the apply UI, the availability API, and the sign-in callback that writes
// the applicant row, so the reserved range can't drift between what the form allows,
// what the API blesses, and what actually gets inserted.

// INVA100 and below are reserved and never self-assigned by applicants.
export const MIN_APPLICANT_CALLSIGN = 101;
export const MAX_APPLICANT_CALLSIGN = 999;

export const APPLICANT_CALLSIGN_RANGE = `${MIN_APPLICANT_CALLSIGN}–${MAX_APPLICANT_CALLSIGN}`;

// Accepts the three digits ("136") or the full form ("INVA136"); returns the digits,
// or null if it isn't three digits at all.
export function toCallsignDigits(value) {
    const digits = String(value ?? '').replace(/\D/g, '');
    return digits.length === 3 ? digits : null;
}

// Whether an applicant may claim this number. Says nothing about whether it's already
// taken — that needs the database.
export function isSelectableApplicantCallsign(value) {
    const digits = toCallsignDigits(value);
    if (!digits) return false;
    const number = parseInt(digits, 10);
    return number >= MIN_APPLICANT_CALLSIGN && number <= MAX_APPLICANT_CALLSIGN;
}
