import Link from "next/link";

export default function NotFound() {
  return (
    <main
      style={{
        display: "grid",
        placeItems: "center",
        minHeight: "100vh",
        padding: "2rem",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "1.6rem",
          alignItems: "flex-start",
        }}
      >
        <h1>Not here</h1>
        <p className='miniNote'>That page doesn&apos;t exist.</p>
        <Link href='/' className='primaryBtn'>
          Back to Today
        </Link>
      </div>
    </main>
  );
}
