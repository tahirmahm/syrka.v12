export function ProductDetailList({ title, items, dark }: { title: string; items: string[]; dark: boolean }) {
  const border = dark ? 'border-syrka-hairline' : 'border-syrka-obsidian/10'
  const muted = dark ? 'text-syrka-steel' : 'text-syrka-obsidian/60'

  return (
    <div className={`w-full border ${border} p-6`}>
      <p className={`font-campus-mono text-[10px] uppercase tracking-widest ${muted}`}>{title}</p>
      <ul className="mt-4 flex flex-col gap-3">
        {items.map((item) => (
          <li key={item} className="flex items-start gap-3 font-campus-sans text-campus-sm">
            <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-syrka-signal" aria-hidden="true" />
            {item}
          </li>
        ))}
      </ul>
    </div>
  )
}
