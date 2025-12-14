import { http, HttpResponse } from 'msw';

const SUPABASE_URL = 'https://topqlhxdflykejrlbuqx.supabase.co';

export const handlers = [
  // Mock drops endpoint
  http.get(`${SUPABASE_URL}/rest/v1/drops`, () => {
    return HttpResponse.json([
      {
        id: 'drop-1',
        fisherman_id: 'fisherman-1',
        sale_point_id: 'sale-point-1',
        eta_at: new Date().toISOString(),
        sale_start_time: new Date(Date.now() + 86400000).toISOString(),
        status: 'scheduled',
        notes: 'Test drop',
        drop_type: 'standard',
      },
    ]);
  }),

  // Mock fishermen endpoint
  http.get(`${SUPABASE_URL}/rest/v1/fishermen`, () => {
    return HttpResponse.json([
      {
        id: 'fisherman-1',
        user_id: 'user-1',
        boat_name: 'Test Boat',
        boat_registration: 'ABC123',
        verified_at: new Date().toISOString(),
      },
    ]);
  }),

  // Mock Edge Functions
  http.post(`${SUPABASE_URL}/functions/v1/send-fisherman-message`, async ({ request }) => {
    const body = (await request.json()) as { contact_ids?: string[] };
    return HttpResponse.json({
      success: true,
      message: 'Messages sent',
      recipients: body.contact_ids?.length || 1,
    });
  }),

  http.post(`${SUPABASE_URL}/functions/v1/create-fisherman-payment`, async () => {
    return HttpResponse.json({
      url: 'https://checkout.stripe.com/test-session',
    });
  }),

  http.get(`${SUPABASE_URL}/functions/v1/get-public-sale-points`, async () => {
    return HttpResponse.json([
      {
        id: 'sale-point-1',
        label: 'Port de Hyères',
        address: '123 Quai du Port',
        latitude: 43.1,
        longitude: 6.1,
        photo_url: null,
        fisherman_id: 'fisherman-1',
        fishermen: {
          id: 'fisherman-1',
          boat_name: 'Test Boat',
          photo_url: null,
          bio: 'Bio test',
          fishing_methods: ['Ligne'],
          company_name: null,
          slug: 'test-boat',
        },
      },
    ]);
  }),

  // Mock storage upload
  http.post(`${SUPABASE_URL}/storage/v1/object/*`, () => {
    return HttpResponse.json({
      Key: 'test-file.jpg',
    });
  }),
];
