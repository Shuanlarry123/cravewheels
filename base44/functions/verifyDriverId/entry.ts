import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { license_front_url, license_back_url } = body;
    if (!license_front_url) {
      return Response.json({ error: 'License photo required' }, { status: 400 });
    }

    const file_urls = [license_front_url];
    if (license_back_url) file_urls.push(license_back_url);

    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `You are an identity-verification specialist reviewing a driver's license image submitted for a food-delivery driver application.

Analyze the image(s) and determine whether this appears to be a GENUINE, valid government-issued driver's license — not a fake, not a photo of a screen, not a printed copy, not digitally altered.

Extract any visible details: full name, date of birth, license number, issuing state, expiration date.

Flag red flags: blurred or illegible text, mismatched fonts, missing security features, signs of digital manipulation, an expired license, or a photo of a photo.

Return a JSON object with:
- is_valid: boolean (true only if it appears genuine and not expired)
- confidence: number 0-100
- extracted_name: string or null
- extracted_dob: string or null
- extracted_license_number: string or null
- extracted_state: string or null
- extracted_expiry: string or null
- red_flags: array of strings (specific issues found, empty if none)
- notes: string (one-sentence assessment)`,
      file_urls,
      response_json_schema: {
        type: "object",
        properties: {
          is_valid: { type: "boolean" },
          confidence: { type: "number" },
          extracted_name: { type: "string" },
          extracted_dob: { type: "string" },
          extracted_license_number: { type: "string" },
          extracted_state: { type: "string" },
          extracted_expiry: { type: "string" },
          red_flags: { type: "array", items: { type: "string" } },
          notes: { type: "string" }
        }
      }
    });

    return Response.json({ verification: result });
  } catch (error) {
    console.error('verifyDriverId error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}