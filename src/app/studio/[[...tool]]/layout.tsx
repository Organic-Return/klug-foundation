export const metadata = {
  title: 'Sanity Studio',
  description: 'Content management studio',
};

export default function StudioLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      id="sanity-studio"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 9999,
        overflow: 'auto',
      }}
    >
      {children}
    </div>
  );
}
