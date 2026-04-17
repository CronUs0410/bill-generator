import { SharedBillView } from "@/components/shared-bill-view";

export default function SharedBillPage({ params }) {
  return (
    <main className="min-h-screen px-4 py-6 sm:px-6 sm:py-8">
      <div className="mx-auto max-w-7xl">
        <SharedBillView token={params.token} />
      </div>
    </main>
  );
}

