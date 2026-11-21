import OwnedBusinessPanel from "@/components/merchant/OwnedBusinessPanel";
import { BusinessInbox } from "@/components/business/BusinessMailbox";

export default function MerchantInbox() {
  return (
    <OwnedBusinessPanel title="Boîte de réception">
      {(businessId) => <BusinessInbox businessId={businessId} />}
    </OwnedBusinessPanel>
  );
}
