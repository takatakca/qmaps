import { AskBusiness } from "./BusinessMailbox";

export default function BusinessAskTab({
  businessId,
  merchantId,
  businessName,
}: {
  businessId: string;
  merchantId: string | null;
  businessName: string;
}) {
  return (
    <section className="space-y-3">
      <h2 className="font-semibold">Écrire à {businessName}</h2>
      <AskBusiness businessId={businessId} merchantId={merchantId} />
    </section>
  );
}
