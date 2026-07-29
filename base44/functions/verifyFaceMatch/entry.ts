import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { selfie_url, id_photo_url } = body;
    if (!selfie_url || !id_photo_url) {
      return Response.json({ error: 'Selfie and ID photo required' }, { status: 400 });
    }

    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `You are an identity-verification specialist comparing two images for a food-delivery driver application.

Image 1 is a selfie (profile photo) taken by the applicant.
Image 2 is a photo of a driver's license.

Determine whether the person in the selfie is the SAME person shown on the driver's license photo.

Consider face shape, facial features, and whether the selfie appears to be a live person rather than a photo of a photo or a screen.

Return a JSON object:
- is_match: boolean (true if it is the same person)
- confidence: number 0-100
- notes: string (brief assessment)`,
      file_urls: [selfie_url, id_photo_url],
      response_json_schema: {
        type: "object",
        properties: {
          is_match: { type: "boolean" },
          confidence: { type: "number" },
          notes: { type: "string" }
        }
      }
    });

    return Response.json({ faceMatch: result });
  } catch (error) {
    console.error('verifyFaceMatch error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}