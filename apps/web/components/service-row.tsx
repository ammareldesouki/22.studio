import { Link } from '../app/i18n/navigation';

const GRADES = [
  'linear-gradient(90deg, rgba(232,25,44,0.12), transparent)',
  'linear-gradient(90deg, rgba(60,140,190,0.14), transparent)',
  'linear-gradient(90deg, rgba(255,190,90,0.13), transparent)',
];

export function ServiceRow({
  service,
  index,
  projectsLabel,
}: {
  service: { name: string; slug: string; description: string | null };
  index: number;
  projectsLabel: string;
}) {
  return (
    <Link
      href={`/services/${service.slug}`}
      data-cursor
      className="group relative flex items-center justify-between gap-6 border-b border-line py-[clamp(26px,3.4vw,52px)] transition-[padding] duration-500 ease-expo hover:ps-[clamp(16px,2vw,40px)]"
    >
      <div
        className="absolute inset-0 -z-10 opacity-0 transition-opacity duration-500 ease-expo group-hover:opacity-100"
        style={{ background: GRADES[index % GRADES.length] }}
      />
      <span className="w-11 flex-none font-display text-[13px] font-medium text-muted">0{index + 1}</span>
      <span className="flex-1 font-display text-[clamp(30px,5vw,68px)] font-extrabold tracking-tight text-white transition-transform duration-500 ease-expo group-hover:translate-x-2.5 rtl:group-hover:-translate-x-2.5">
        {service.name}
      </span>
      {service.description && (
        <p className="hidden max-w-[26ch] text-end text-[15px] text-muted opacity-0 transition-opacity duration-500 group-hover:opacity-100 md:block">
          {service.description}
        </p>
      )}
      <span className="flex-none whitespace-nowrap font-display text-[13px] font-semibold text-red">{projectsLabel}</span>
    </Link>
  );
}
