"use client";

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className='panel' style={{ maxWidth: 560 }}>
      <h2 className='cardTitle'>Something went wrong</h2>
      <p className='miniNote'>
        The page couldn&apos;t load. If this keeps happening, check that the
        database is reachable.
      </p>
      <button
        type='button'
        className='primaryBtn'
        onClick={reset}
        style={{ width: "fit-content" }}
      >
        Try again
      </button>
    </div>
  );
}
