/** Page title, one-line description, and the page's main action on the right. */
export function KepalaHalaman({
  judul,
  keterangan,
  aksi,
}: {
  judul: string;
  keterangan: string;
  aksi?: React.ReactNode;
}) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold">{judul}</h1>
        <p className="text-base text-slate-700">{keterangan}</p>
      </div>
      {aksi}
    </header>
  );
}
