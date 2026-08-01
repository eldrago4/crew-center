import styles from './pilotProfile.module.css'

// Suspense fallback for both profile routes.
//
// A cold profile has to scan the pilot's whole PIREP history (plus Firestore and
// the IF API), so the first load for a given callsign is genuinely slow. With an
// empty fallback the page had no height at all until that finished, which let the
// site footer ride up under the navbar. This holds a viewport's worth of the real
// layout so the page keeps its shape while the data streams in.
//
// No 'use client': it renders once and never does anything.
function Block({ w = '100%', h = 16, circle = false, style }) {
  return (
    <div
      className={`${styles.skelBlock} ${circle ? styles.skelCircle : ''}`}
      style={{ width: w, height: h, ...style }}
    />
  )
}

export default function ProfileSkeleton({ showBack = false }) {
  return (
    <div className={`${styles.page} ${styles.skeleton}`} aria-busy="true" aria-label="Loading pilot profile">
      <div className={`${styles.tierBg} ${styles.base}`} />

      <div className={`${styles.inner} ${showBack ? '' : styles.underNavbar}`}>
        <div className={styles.skelHeader}>
          {/* hours + short stats */}
          <div className={styles.skelCol}>
            <Block w="120px" h={10} />
            <Block w="220px" h={48} />
            <Block w="100%" h={1} />
            <div style={{ display: 'flex', gap: 28 }}>
              <Block w="70px" h={34} />
              <Block w="70px" h={34} />
              <Block w="90px" h={34} />
            </div>
          </div>

          {/* portrait, name, rank, badges */}
          <div className={`${styles.skelCol} ${styles.skelCentre}`}>
            <Block w="196px" h={196} circle />
            <Block w="240px" h={34} style={{ marginTop: 6 }} />
            <Block w="130px" h={12} />
            <div style={{ display: 'flex', gap: 14, marginTop: 8 }}>
              <Block w="48px" h={48} circle />
              <Block w="48px" h={48} circle />
              <Block w="48px" h={48} circle />
            </div>
          </div>

          {/* favourite aircraft + contact row */}
          <div className={styles.skelCol} style={{ alignItems: 'flex-end' }}>
            <Block w="min(100%, 400px)" h={12} />
            <Block w="min(100%, 400px)" h={200} />
            <Block w="min(100%, 400px)" h={42} />
          </div>
        </div>

        {/* climb ladder */}
        <div style={{ padding: '34px 0 40px', borderTop: '1px solid var(--line)' }}>
          <Block w="200px" h={22} style={{ marginBottom: 24 }} />
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4 }}>
            {[12, 24, 36, 48, 60, 72, 88].map((h, i) => (
              <div key={i} style={{ flex: 1 }}>
                <Block h={h} />
              </div>
            ))}
          </div>
        </div>

        {/* stats strip */}
        <div className={styles.skelStrip}>
          {Array.from({ length: 6 }).map((_, i) => (
            <Block key={i} h={40} />
          ))}
        </div>

        {/* map + panels */}
        <div style={{ padding: '34px 0' }}>
          <Block w="240px" h={22} style={{ marginBottom: 22 }} />
          <Block h={430} />
        </div>
        <div className={styles.skelPanels}>
          <Block h={280} />
          <Block h={280} />
        </div>
      </div>
    </div>
  )
}
