import { Kalam, Patrick_Hand } from 'next/font/google';
import styles from './career.module.css';

const kalam = Kalam({
    subsets: ['latin'],
    weight: ['300', '400', '700'],
    variable: '--font-kalam',
    display: 'swap',
});

const patrickHand = Patrick_Hand({
    subsets: ['latin'],
    weight: '400',
    variable: '--font-patrick-hand',
    display: 'swap',
});

export const metadata = {
    title: 'Career Mode',
    description:
        "INVA Career Mode: an aviation career simulation with ranks, salaries, type ratings and FDTL. Fly your way from Cadet to Chief Pilot.",
    alternates: { canonical: '/career' },
    openGraph: {
        title: 'INVA Career Mode — Where every flight is a story in the making',
        description:
            'Ranks, salaries, type ratings and FDTL. Fly your way from Cadet to Chief Pilot.',
        url: '/career',
    },
};

/* Material Symbols is a ligature icon font: the glyph is selected by the text
   content, so the name doubles as the accessible label — hence aria-hidden. */
function Icon({ name, className }) {
    return (
        <span className={`${styles.icon} ${className || ''}`} aria-hidden="true">
            {name}
        </span>
    );
}

const RANKS = [
    { hours: '0h', name: 'Cadet', pay: 'Base: ₹18k | HRA: ₹7.2k', total: '₹25.2k', tone: 'red', chip: 'muted', rowRot: '', chipRot: 'rot2' },
    { hours: '80h', name: 'Junior First Officer', pay: 'Base: ₹28k | HRA: ₹11.2k', total: '₹39.2k', tone: 'blue', chip: 'dim', rowRot: 'rotN1', chipRot: 'rotN2' },
    { hours: '200h', name: 'First Officer', pay: 'Base: ₹42k | HRA: ₹16.8k', total: '₹58.8k', tone: 'blue', chip: 'dim', rowRot: 'rot1', chipRot: 'rot1' },
    { hours: '500h', name: 'Senior First Officer', pay: 'Base: ₹60k | HRA: ₹24k', total: '₹84k', tone: 'blue', chip: 'fixed', rowRot: '', chipRot: 'rotN1' },
    { hours: '900h', name: 'Captain', pay: 'Base: ₹90k | HRA: ₹36k', total: '₹126k', tone: 'ink', chip: 'container', rowRot: 'rot2', chipRot: 'rot3' },
    { hours: '1500h', name: 'Senior Captain', pay: 'Base: ₹1.1L | HRA: ₹44k', total: '₹1.54L', tone: 'red', chip: 'primary', rowRot: 'rotN1', chipRot: 'rotN1' },
];

const CHIP_BG = {
    muted: 'var(--paper-muted)',
    dim: 'var(--secondary-fixed-dim)',
    fixed: 'var(--secondary-fixed)',
    container: 'var(--secondary-container)',
    primary: 'var(--primary-fixed)',
};

const TONE = {
    red: 'var(--primary)',
    blue: 'var(--ballpoint-blue)',
    ink: 'var(--ink-black)',
};

export default function CareerPage() {
    return (
        <>
            {/* precedence lets React hoist and dedupe this into <head>. Kept as a
                stylesheet rather than next/font because next/font fetches at build
                time — a Google Fonts hiccup would fail the deploy, whereas this
                degrades to missing icons. */}
            <link
                rel="stylesheet"
                precedence="default"
                href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=block"
            />

            <div className={`${styles.page} ${kalam.variable} ${patrickHand.variable}`}>
                <main className={styles.main}>
                    {/* ---- Hero ---- */}
                    <section className={styles.hero}>
                        <div className={styles.heroCopy}>
                            <h1 className={`${styles.fDisplay} ${styles.tDisplay} ${styles.heroTitle}`}>
                                INVACareer: <em>Where every flight is a story in the making.</em>
                            </h1>
                            <p className={`${styles.fBody} ${styles.heroLede}`}>
                                Step into the most immersive aviation career simulation ever crafted.
                                Beyond simple logging, we&apos;ve built a living ecosystem that rewards
                                your skill, tracks your legacy, and lets you experience the true life of
                                a professional aviator. Your journey from Cadet to Chief Pilot starts
                                here.
                            </p>
                            <div className={styles.pullQuote}>
                                <p className={styles.fBody}>
                                    &ldquo;The pinnacle of your career: Unlocking the Rajvanshi rank
                                    isn&apos;t just a prestige goal—it&apos;s your invitation to our most
                                    exclusive circle of friends and elite aviators.&rdquo;
                                </p>
                            </div>
                            <div className={styles.heroNote}>
                                <Icon name="home_work" className={styles.iconLg} />
                                <p className={styles.fHeadline}>
                                    A shared journey with 70+ aviators who speak your language.
                                    You&apos;re never flying solo here.
                                </p>
                            </div>
                        </div>

                        <div className={styles.polaroid}>
                            <div className={styles.tape} />
                            <div className={styles.polaroidPhoto}>
                                <img
                                    src="/career/captains-study.jpg"
                                    alt="A hand-drawn illustration of an airliner flight deck at sunset, panels and yokes sketched in ink and wash."
                                    width={320}
                                    height={256}
                                />
                            </div>
                            <p className={`${styles.fHeadline} ${styles.polaroidCaption}`}>
                                &ldquo;The Captain&apos;s Study&rdquo;
                            </p>
                        </div>
                    </section>

                    {/* ---- Compensation ---- */}
                    <section className={styles.section}>
                        <h2
                            className={`${styles.fHeadline} ${styles.tHeadlineLg} ${styles.sectionTitle} ${styles.centered} ${styles.underlineDashed}`}
                        >
                            Official Compensation Structure
                        </h2>
                        <div className={styles.ladder}>
                            {RANKS.map((r) => (
                                <div
                                    key={r.name}
                                    className={`${styles.rankRow} ${styles[r.rowRot] || ''}`}
                                >
                                    <div
                                        className={`${styles.fHeadline} ${styles.rankHours} ${styles[r.chipRot] || ''}`}
                                        style={{ background: CHIP_BG[r.chip] }}
                                    >
                                        {r.hours}
                                    </div>
                                    <div className={styles.rankBody}>
                                        <h4 className={`${styles.fHeadline} ${styles.rankName}`}>
                                            {r.name}
                                        </h4>
                                        <p className={`${styles.fBody} ${styles.rankPay}`}>{r.pay}</p>
                                    </div>
                                    <div className={styles.rankTotal}>
                                        <p className={styles.fLabel} style={{ color: TONE[r.tone] }}>
                                            {r.total}
                                        </p>
                                        <p className={styles.rankTotalLabel}>Total/Mo</p>
                                    </div>
                                </div>
                            ))}

                            <div className={`${styles.rankRow} ${styles.rankRowChief}`}>
                                <div className={`${styles.fHeadline} ${styles.rankHours} ${styles.rot2}`}>
                                    2200h
                                </div>
                                <div className={styles.rankBody}>
                                    <h4 className={`${styles.fHeadline} ${styles.rankName}`}>
                                        Chief Pilot
                                    </h4>
                                    <p className={`${styles.fBody} ${styles.rankPay}`}>
                                        Base: ₹1.3L | HRA: ₹52k
                                    </p>
                                </div>
                                <div className={styles.rankTotal}>
                                    <p className={styles.fHeadline}>₹1.82L</p>
                                    <p className={styles.rankTotalLabel}>Commander Rank</p>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* ---- Fleet & training ---- */}
                    <section className={styles.section}>
                        <h2
                            className={`${styles.fHeadline} ${styles.tHeadlineLg} ${styles.sectionTitle} ${styles.centered}`}
                        >
                            Fleet &amp; Training Path
                        </h2>
                        <div className={styles.twoCol}>
                            <div className={`${styles.card} ${styles.rot1}`}>
                                <div className={styles.tape} />
                                <h3 className={`${styles.fHeadline} ${styles.cardTitle}`}>
                                    Three Tiers of Fleet Credentials
                                </h3>
                                <ul className={`${styles.fBody} ${styles.checkList}`}>
                                    <li>
                                        <Icon name="check_circle" />
                                        <div>
                                            <strong>Base Type Ratings:</strong> Standalone investments
                                            for core fleet types.
                                        </div>
                                    </li>
                                    <li>
                                        <Icon name="check_circle" />
                                        <div>
                                            <strong>Crew Familiarization:</strong> Variant training for
                                            aircraft like the A321 or 737 MAX.
                                        </div>
                                    </li>
                                    <li>
                                        <Icon name="check_circle" />
                                        <div>
                                            <strong>Operational Qualifications:</strong> Specialized
                                            mission-ready certifications.
                                        </div>
                                    </li>
                                </ul>
                            </div>

                            <div className={styles.stack}>
                                <div className={`${styles.fleetLocked} ${styles.rotN1}`}>
                                    <h4 className={styles.fHeadline}>Rank-Locked Heavy Metal</h4>
                                    <p className={styles.fBody}>
                                        Access to long-haul giants is earned through experience:
                                    </p>
                                    <div className={`${styles.fLabel} ${styles.fleetTable}`}>
                                        <div>
                                            <span>Senior First Officer</span>
                                            <span>Boeing 787</span>
                                        </div>
                                        <div>
                                            <span>Captain</span>
                                            <span>Boeing 777</span>
                                        </div>
                                        <div>
                                            <span>Senior Captain</span>
                                            <span>Airbus A350</span>
                                        </div>
                                    </div>
                                </div>

                                <div className={`${styles.chiefReward} ${styles.rot1}`}>
                                    <div className={styles.chiefRewardInner}>
                                        <Icon
                                            name="military_tech"
                                            className={`${styles.iconLg} ${styles.iconRed}`}
                                        />
                                        <div>
                                            <h4 className={styles.fHeadline}>Chief Pilot Reward</h4>
                                            <p className={styles.fBody}>
                                                Reach the pinnacle to receive your{' '}
                                                <strong>complimentary Boeing 747-400</strong> type
                                                rating. The Queen of the Skies awaits.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* ---- Global ops ---- */}
                    <section className={styles.section}>
                        <div className={styles.opsPanel}>
                            <div className={`${styles.fLabel} ${styles.opsBadge}`}>GLOBAL OPS</div>
                            <h2 className={`${styles.fHeadline} ${styles.tHeadlineLg} ${styles.sectionTitle}`}>
                                Global Operational Credentials
                            </h2>
                            <div className={styles.opsGrid}>
                                <div className={styles.opsCard}>
                                    <h5 className={styles.fHeadline}>Oceanic/Long-Haul</h5>
                                    <p className={styles.fBody}>Required for sectors exceeding 3,000 NM.</p>
                                </div>
                                <div className={`${styles.opsCard} ${styles.rotN1}`}>
                                    <h5 className={styles.fHeadline}>ETOPS</h5>
                                    <p className={styles.fBody}>
                                        Extended operations for routes over 1,800 NM.
                                    </p>
                                </div>
                                <div className={`${styles.opsCard} ${styles.rot1}`}>
                                    <h5 className={styles.fHeadline}>CAT II/III</h5>
                                    <p className={styles.fBody}>
                                        Low visibility approach and landing authorization.
                                    </p>
                                </div>
                                <div className={styles.opsCard}>
                                    <h5 className={styles.fHeadline}>Special Airports</h5>
                                    <p className={styles.fBody}>
                                        VQPR (Paro) &amp; VILH (Leh) qualifications.
                                    </p>
                                </div>
                            </div>
                            <div className={`${styles.fBody} ${styles.opsFooter}`}>
                                <p>
                                    <Icon name="payments" /> Certification Cost: ₹20,000 per credential
                                </p>
                                <p>
                                    <Icon name="history" /> Recurrency: 6-12 months validity limits
                                </p>
                            </div>
                        </div>
                    </section>

                    {/* ---- Simulation features ---- */}
                    <section className={styles.section}>
                        <h2 className={`${styles.fHeadline} ${styles.tHeadlineLg} ${styles.sectionTitle}`}>
                            Key Simulation Features
                        </h2>
                        <div className={styles.featureGrid}>
                            <div className={styles.feature}>
                                <div className={`${styles.tape} ${styles.tapeLeft}`} />
                                <Icon
                                    name="route"
                                    className={`${styles.featureIcon} ${styles.iconBlue}`}
                                />
                                <h3 className={styles.fHeadline}>Sector Planning &amp; FDTL</h3>
                                <p className={`${styles.fBody} ${styles.featureBody}`}>
                                    Plan your day with precision. Standard rotations consist of 2 to 8
                                    legs with a strictly enforced 11-hour Flight Duty Time Limit (FDTL)
                                    for maximum safety.
                                </p>
                                <div className={styles.featureSplit}>
                                    <p className={`${styles.fLabel} ${styles.featureSplitTitle}`}>
                                        <Icon name="emergency" />
                                        Premium Sectors
                                    </p>
                                    <p className={styles.fBody}>
                                        Need more time? Use Premium Tokens for relaxed FDTL up to 64
                                        hours.
                                    </p>
                                </div>
                            </div>

                            <div className={`${styles.feature} ${styles.featureAlt} ${styles.rotN1}`}>
                                <div className={`${styles.tape} ${styles.tapeRight}`} />
                                <Icon
                                    name="build_circle"
                                    className={`${styles.featureIcon} ${styles.iconRed}`}
                                />
                                <h3 className={styles.fHeadline}>Maintenance Logs</h3>
                                <p className={`${styles.fBody} ${styles.featureBody}`}>
                                    Every landing counts. Your PIREPs affect airframe health for
                                    everyone. Check the notes left by your fellow captains and keep the
                                    fleet in top shape for the next crew.
                                </p>
                                <div className={`${styles.fLabel} ${styles.featureCallout}`}>
                                    <Icon name="info" />
                                    &ldquo;We record the butter, but we log the thuds.&rdquo;
                                </div>
                            </div>

                            <div className={`${styles.feature} ${styles.rot1}`}>
                                <Icon
                                    name="airlines"
                                    className={`${styles.featureIcon} ${styles.iconSecondary}`}
                                />
                                <h3 className={styles.fHeadline}>Deadhead Passes</h3>
                                <p className={`${styles.fBody} ${styles.featureBody}`}>
                                    Find yourself at a remote hub? Use a Deadhead Pass for free
                                    repositioning back to home base (VIDP). We look after our own.
                                </p>
                            </div>

                            <div className={`${styles.feature} ${styles.featurePayout}`}>
                                <div className={`${styles.fLabel} ${styles.newBadge}`}>NEW FEATURE</div>
                                <Icon
                                    name="payments"
                                    className={`${styles.featureIcon} ${styles.iconOnSecondary}`}
                                />
                                <h3 className={styles.fHeadline}>Real-Time Rupee Breakdown</h3>
                                <p className={styles.fBody}>
                                    Experience the satisfaction of the <strong>Live Payout Preview</strong>.
                                    See your wallet earnings climb as you taxi to the gate. Transparency
                                    at every turn.
                                </p>
                            </div>
                        </div>
                    </section>

                    {/* ---- Divider ---- */}
                    <div className={styles.divider}>
                        <div className={styles.dividerRule}>
                            <Icon name="flight" className={styles.dividerIcon} />
                        </div>
                    </div>

                    {/* ---- Quality of life ---- */}
                    <section className={styles.qol}>
                        <div className={styles.qolCopy}>
                            <h2 className={`${styles.fHeadline} ${styles.tHeadlineLg} ${styles.qolTitle}`}>
                                Designed for Flight, Not Friction
                            </h2>
                            <div className={styles.qolList}>
                                <div className={styles.qolItem}>
                                    <Icon name="edit_note" className={styles.iconBlue} />
                                    <div>
                                        <h4 className={styles.fHeadline}>Auto-Logging Logic</h4>
                                        <p className={styles.fBody}>
                                            We sync with your simulator telemetry in real-time. No manual
                                            data entry, no missing hours. Just fly; the logbook writes
                                            itself.
                                        </p>
                                    </div>
                                </div>
                                <div className={styles.qolItem}>
                                    <Icon name="groups" className={styles.iconRed} />
                                    <div>
                                        <h4 className={styles.fHeadline}>
                                            The &ldquo;Colleague&rdquo; Philosophy
                                        </h4>
                                        <p className={styles.fBody}>
                                            Career Mode is built on the spirit of the crew room. Our
                                            interface is designed to feel like a shared space where you
                                            can swap stories and track progress alongside your peers.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className={styles.qolFigure}>
                            <div className={styles.qolCard}>
                                <div className={styles.tape} />
                                <div className={styles.qolPhoto}>
                                    <img
                                        src="/career/patch-collection.jpg"
                                        alt="An INVA Career Mode patch collection board: twelve embroidered flight-milestone patches, including Skybound Ace, Globe Hopper, Star Pilot and Nighthawk."
                                        width={320}
                                        height={192}
                                        loading="lazy"
                                        decoding="async"
                                    />
                                </div>
                                <p className={`${styles.fBody} ${styles.qolQuote}`}>
                                    &ldquo;It&apos;s about the journey, not just the destination. Every
                                    entry is a story.&rdquo;
                                </p>
                                <div className={styles.qolAttrib}>
                                    <p className={styles.fHeadline}>- INVA Flight Manual v4.0</p>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* ---- Career highlights ---- */}
                    <section className={styles.section}>
                        <h2
                            className={`${styles.fHeadline} ${styles.tHeadlineLg} ${styles.sectionTitle} ${styles.centered} ${styles.italic}`}
                        >
                            Career Highlights
                        </h2>
                        <div className={styles.notes}>
                            <div className={`${styles.note} ${styles.noteBlue} ${styles.rotN1}`}>
                                <h4 className={styles.fHeadline}>Rajvanshi Rank?</h4>
                                <p className={styles.fBody}>
                                    Career Mode is our most immersive community experience. Earn your
                                    place among the elite and join the shared legacy of those who have
                                    reached the Rajvanshi rank.
                                </p>
                            </div>
                            <div className={`${styles.note} ${styles.noteRed} ${styles.rot2}`}>
                                <h4 className={styles.fHeadline}>Token Usage</h4>
                                <p className={styles.fBody}>
                                    Tokens are used for Premium Sectors, jumping seats, and acquiring
                                    specialized fleet certifications. Earn them by sticking to your
                                    schedule.
                                </p>
                            </div>
                            <div className={`${styles.note} ${styles.noteBlue} ${styles.rotN2}`}>
                                <h4 className={styles.fHeadline}>Realism Policy</h4>
                                <p className={styles.fBody}>
                                    We value authenticity. Fuel, payload, and cruise speeds must match
                                    your OFP. Integrity is the foundation of the career mode.
                                </p>
                            </div>
                        </div>
                    </section>

                    {/* ---- Closing ---- */}
                    <section className={styles.closing}>
                        <div className={styles.closingInner}>
                            <h2 className={`${styles.fDisplay} ${styles.tDisplay} ${styles.closingTitle}`}>
                                Cleared for Departure.
                            </h2>
                            <Icon name="near_me" className={styles.closingArrow} />
                        </div>
                        <p className={`${styles.fBody} ${styles.closingLede}`}>
                            Your career isn&apos;t just numbers on a screen; it&apos;s a legacy written
                            in ink and air. We&apos;ll see you in the skies, Captain.
                        </p>
                        <div className={styles.closingLinks}>
                            <a
                                className={styles.closingLink}
                                href="https://infiniteflight.com/guide"
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                <Icon name="book_5" className={styles.iconBlue} />
                                <p className={styles.fLabel}>Open Manual</p>
                            </a>
                            <a className={styles.closingLink} href="/apply">
                                <Icon name="forum" className={styles.iconRed} />
                                <p className={styles.fLabel}>Dispatch Center</p>
                            </a>
                        </div>
                    </section>
                </main>

                <footer className={styles.footer}>
                    <div className={`${styles.fHeadline} ${styles.tHeadlineLg} ${styles.footerBrand}`}>
                        INVACareer
                    </div>
                    <div className={`${styles.fLabel} ${styles.footerLinks}`}>
                        {/* The design's placeholder was href="#"; pointed at the page
                            itself, which is what "Overview" means here. */}
                        <a href="/career">Overview</a>
                    </div>
                </footer>
            </div>
        </>
    );
}
