import NextImage from 'next/image'
import { RxArrowTopRight } from 'react-icons/rx'
import styles from './footer.module.css'
import { footerFontClass } from '@/lib/brandFonts'

const QUICK_LINKS = [
  { href: '/info', label: 'About' },
  { href: '/fleet', label: 'Fleet Information' },
  { href: '/ranks', label: 'Pilot Ranks' },
  { href: '/events', label: 'Events' },
]

const COMMUNITY_LINKS = [
  { href: 'https://community.infiniteflight.com/u/indianvirtual/summary', label: 'IFC Account', external: true },
  { href: 'https://community.infiniteflight.com/t/inva-official-2024-thread/925631', label: 'IFC Thread', external: true },
]

export default function Footer() {
  return (
    <footer className={`${styles.footer} ${footerFontClass}`}>
      {/* Brand furniture — both purely decorative, hidden from assistive tech. */}
      <span className={styles.brandMark} aria-hidden="true">INVA</span>
      <NextImage
        src="/livery/air-india/A359.webp"
        alt=""
        aria-hidden="true"
        width={2048}
        height={736}
        className={styles.aircraft}
        sizes="(max-width: 900px) 120vw, 68vw"
      />

      <div className={styles.body}>
        <div className={styles.grid}>
          <div>
            <div className={styles.brandRow}>
              <span className={styles.logoRing}>
                <NextImage src="/invaLogo.svg" width={40} height={40} alt="" aria-hidden="true" />
              </span>
              <div>
                <h2 className={styles.wordmark}>Indian Virtual</h2>
                <p className={styles.tagline}>India&apos;s spirit, now boarding</p>
              </div>
            </div>

            <p className={styles.blurb}>
              Indian Virtual is your gateway to connecting India with the world like no
              other. We offer virtual pilots the unique opportunity to explore the diverse
              landscapes of the Indian subcontinent, from bustling cities to remote,
              unexplored regions.
            </p>

            <span className={styles.flagLine}>🇮🇳 Proudly Indian</span>
          </div>

          <nav aria-labelledby="footer-quick-links">
            <h2 className={styles.colHead} id="footer-quick-links">Quick Links</h2>
            <div className={styles.links}>
              {QUICK_LINKS.map((l) => (
                <a key={l.href} className={styles.link} href={l.href}>
                  {l.label}
                  <RxArrowTopRight className={styles.linkArrow} aria-hidden="true" />
                </a>
              ))}
            </div>
          </nav>

          <nav aria-labelledby="footer-community">
            <h2 className={styles.colHead} id="footer-community">Community</h2>
            <div className={styles.links}>
              {COMMUNITY_LINKS.map((l) => (
                <a
                  key={l.href}
                  className={styles.link}
                  href={l.href}
                  target="_blank"
                  rel="noreferrer"
                >
                  {l.label}
                  <RxArrowTopRight className={styles.linkArrow} aria-hidden="true" />
                </a>
              ))}
            </div>
            <a className={styles.cta} href="/apply">Join our crew ✈</a>
          </nav>
        </div>
      </div>

      <div className={styles.strip}>
        <div className={styles.stripInner}>
          <div>
            <p className={styles.copy}>© 2026 Indian Virtual Airlines. All rights reserved.</p>
            <p className={styles.credit}>
              Proudly crafted by <strong>VortexVolt</strong> &amp; <strong>eldrago</strong>
            </p>
            <div className={styles.legalRow}>
              <a className={styles.legalLink} href="/privacy">Privacy Policy</a>
              <span className={styles.legalDot}>·</span>
              <a className={styles.legalLink} href="/terms">Terms of Service</a>
            </div>
          </div>
          <p className={styles.disclaimer}>
            Indian Virtual Airlines is not affiliated with any real-world commercial
            aviation service and/or Infinite Flight LLC in any form. This is a virtual
            airline for simulation purposes only.
          </p>
        </div>
      </div>
    </footer>
  )
}
