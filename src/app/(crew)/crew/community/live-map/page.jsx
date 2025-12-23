export default function Page() {
  return (
    <div>
      <iframe
        src="https://inva-flight-tracker.vercel.app/embed"
        width="100%"
        height="600"
        style={{ border: 'none', borderRadius: '12px', overflow: 'hidden' }}
        allowFullScreen
        loading="lazy"
        title="Infinite Flight Tracker"
      ></iframe>
    </div>
  );
}
