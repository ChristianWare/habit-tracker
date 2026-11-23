export type CategoryRef = { id: string; name: string; color: string };

export default function CategoryPill({ c }: { c: CategoryRef }) {
  return (
    <span className='pill'>
      <span className='dot' style={{ backgroundColor: c.color }} />
      {c.name}
    </span>
  );
}
