import { ProductLanding } from '../../../src/components/ProductLanding';

export const metadata = { title: 'AI Client Acquisition System' };

export default function ClientAcquisitionSystemPage() {
  return (
    <ProductLanding
      productId="ai_client_acquisition_1499"
      blurb="The full operating system: the acquisition funnel, the delivery workflow, and the automation that keeps both running without you."
      includes={[
        'Everything in the AI Freelancing Launch Kit',
        'The acquisition funnel, end to end',
        'Delivery workflow and client handover checklists',
        'Automation recipes for follow-up, invoicing and reporting',
      ]}
    />
  );
}
