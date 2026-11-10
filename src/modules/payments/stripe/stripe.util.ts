import type Stripe from 'stripe';

export function getStripeShippingOptions(): Stripe.Checkout.SessionCreateParams.ShippingOption[] {
  return [
    {
      shipping_rate_data: {
        type: 'fixed_amount',
        fixed_amount: { amount: 689, currency: 'myr' },
        display_name: 'J&T Express (Drop-Off) (From Point to Door)',
        delivery_estimate: {
          minimum: { unit: 'business_day', value: 1 },
          maximum: { unit: 'business_day', value: 1 },
        },
        metadata: {
          service_id: 'EP-CS050',
          service_name: 'J&T Express (Drop-Off) (From Point to Door)',
          courier_id: 'EP-CR0AL',
          courier_name: 'J&T Express (Malaysia) Sdn. Bhd.',
        },
      },
    },
    {
      shipping_rate_data: {
        type: 'fixed_amount',
        fixed_amount: { amount: 689, currency: 'myr' },
        display_name: 'J&T Express (Pick Up) (From Door to Door)',
        delivery_estimate: {
          minimum: { unit: 'business_day', value: 1 },
          maximum: { unit: 'business_day', value: 1 },
        },
        metadata: {
          service_id: 'EP-CS098',
          service_name: 'J&T Express (Pick Up) (From Door to Door)',
          courier_id: 'EP-CR0AL',
          courier_name: 'J&T Express (Malaysia) Sdn. Bhd.',
        },
      },
    },
    {
      shipping_rate_data: {
        type: 'fixed_amount',
        fixed_amount: { amount: 739, currency: 'myr' },
        display_name: 'Poslaju (Pick Up) (From Door to Door)',
        delivery_estimate: {
          minimum: { unit: 'business_day', value: 1 },
          maximum: { unit: 'business_day', value: 1 },
        },
        metadata: {
          service_id: 'EP-CS09R',
          service_name: 'Poslaju (Pick Up) (From Door to Door)',
          courier_id: 'EP-CR0AM',
          courier_name: 'Poslaju National Courier',
        },
      },
    },
  ];
}
