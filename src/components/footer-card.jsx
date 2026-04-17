import { Card, SectionHeading } from "@/components/ui";

export function FooterCard({ title, settings }) {
  return (
    <Card className="overflow-hidden">
      <SectionHeading title={title} />
      <div className="grid gap-4 p-5 text-sm text-slate-700 sm:grid-cols-2 sm:p-6">
        <div className="rounded-2xl bg-slate-50 p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Contact 1</p>
          <p className="mt-2 text-base font-semibold text-brand">{settings.contact_name1}</p>
          <p className="mt-1">{settings.contact_phone1}</p>
        </div>
        <div className="rounded-2xl bg-slate-50 p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Contact 2</p>
          <p className="mt-2 text-base font-semibold text-brand">{settings.contact_name2}</p>
          <p className="mt-1">{settings.contact_phone2}</p>
        </div>
      </div>
    </Card>
  );
}

