// Prompt templates - 10 conversational variations
const PROMPT_TEMPLATES = [
  "I need {service} in {location}, who should I hire?",
  "Can you recommend a good {business_type} in {location}?",
  "What are the best {business_types} in {location}?",
  "Looking for someone to {action} in {location}, any suggestions?",
  "I'm planning to {action} in {location}, who are my options?",
  "Who does quality {service} in {location}?",
  "Need recommendations for {service} in {location}",
  "What are my options for {service} in {location}?",
  "Looking for a reliable {business_type} in {location}",
  "Affordable {service} in {location}",
]

// Industry-to-variable mapping for all 8 industries
// Each industry has US and Singapore variations
const INDUSTRY_MAPPING: Record<
  string,
  {
    us: { service: string; business_type: string; action: string; business_types: string }
    sg: { service: string; business_type: string; action: string; business_types: string }
  }
> = {
  'Home Renovation/Remodeling': {
    us: {
      service: 'kitchen renovation',
      business_type: 'contractor',
      action: 'remodel my kitchen',
      business_types: 'contractors',
    },
    sg: {
      service: 'kitchen renovation',
      business_type: 'contractor',
      action: 'renovate my kitchen',
      business_types: 'contractors',
    },
  },
  'Photography (Wedding, Event, Portrait)': {
    us: {
      service: 'wedding photography',
      business_type: 'photographer',
      action: 'find a wedding photographer',
      business_types: 'photographers',
    },
    sg: {
      service: 'wedding photography',
      business_type: 'photographer',
      action: 'find a wedding photographer',
      business_types: 'photographers',
    },
  },
  'Real Estate Agent (US) / Property Agent (SG)': {
    us: {
      service: 'real estate',
      business_type: 'agent',
      action: 'find a real estate agent',
      business_types: 'agents',
    },
    sg: {
      service: 'property',
      business_type: 'agent',
      action: 'find a property agent',
      business_types: 'agents',
    },
  },
  'Plumbing Services': {
    us: {
      service: 'plumbing',
      business_type: 'plumber',
      action: 'fix a plumbing issue',
      business_types: 'plumbers',
    },
    sg: {
      service: 'plumbing',
      business_type: 'plumber',
      action: 'fix a plumbing issue',
      business_types: 'plumbers',
    },
  },
  'Consulting (Business, Marketing, IT)': {
    us: {
      service: 'business consulting',
      business_type: 'consultant',
      action: 'hire a business consultant',
      business_types: 'consultants',
    },
    sg: {
      service: 'business consulting',
      business_type: 'consultant',
      action: 'hire a business consultant',
      business_types: 'consultants',
    },
  },
  'Web Design/Development': {
    us: {
      service: 'web design',
      business_type: 'web designer',
      action: 'build a website',
      business_types: 'web designers',
    },
    sg: {
      service: 'web design',
      business_type: 'web designer',
      action: 'build a website',
      business_types: 'web designers',
    },
  },
  'HVAC Services (US) / Air Conditioning Services (SG)': {
    us: {
      service: 'HVAC',
      business_type: 'HVAC contractor',
      action: 'repair my HVAC system',
      business_types: 'HVAC contractors',
    },
    sg: {
      service: 'aircon servicing',
      business_type: 'aircon technician',
      action: 'service my air conditioning',
      business_types: 'aircon technicians',
    },
  },
  'Landscaping/Lawn Care': {
    us: {
      service: 'landscaping',
      business_type: 'landscaper',
      action: 'landscape my yard',
      business_types: 'landscapers',
    },
    sg: {
      service: 'landscaping',
      business_type: 'landscaper',
      action: 'landscape my garden',
      business_types: 'landscapers',
    },
  },
}

/**
 * Generates location variations for US locations
 * For Singapore, returns just "Singapore"
 */
function generateLocationVariations(location: string, country: string): string[] {
  if (country === 'Singapore') {
    return ['Singapore']
  }

  // US location variations
  const parts = location.split(',').map((s) => s.trim())
  const city = parts[0] || location
  const state = parts[1]?.replace(/[()]/g, '').trim() || ''

  // Extract common abbreviations (e.g., "Los Angeles" -> "LA")
  const cityWords = city.split(' ')
  const abbreviation =
    cityWords.length > 1
      ? cityWords.map((w) => w[0]).join('').toUpperCase()
      : city.substring(0, 2).toUpperCase()

  return [
    city, // "Los Angeles"
    abbreviation, // "LA"
    location, // "Los Angeles, CA"
    `the ${city} area`, // "the Los Angeles area"
  ]
}

/**
 * Generates 10 conversational prompts based on business information
 * 
 * @param businessName - Name of the business (currently not used in templates, reserved for future use)
 * @param industry - Industry type (must match one of the 8 supported industries)
 * @param country - Either "United States" or "Singapore"
 * @param location - Location string (e.g., "Los Angeles, CA" for US, "Singapore" for SG)
 * @returns Array of 10 prompt strings
 */
export function generatePrompts(
  businessName: string,
  industry: string,
  country: string,
  location: string
): string[] {
  const mapping = INDUSTRY_MAPPING[industry]
  if (!mapping) {
    console.warn(`Unknown industry: ${industry}`)
    return []
  }

  const vars = country === 'United States' ? mapping.us : mapping.sg
  const locationVariations = generateLocationVariations(location, country)

  // Map each template to a specific location variation for variety
  // This ensures we get a good mix of location formats across the 10 prompts
  const locationMap = [
    locationVariations[0], // "Los Angeles"
    locationVariations[0], // "Los Angeles"
    locationVariations[1], // "LA"
    locationVariations[0], // "Los Angeles"
    locationVariations[1], // "LA"
    locationVariations[0], // "Los Angeles"
    locationVariations[1], // "LA"
    locationVariations[0], // "Los Angeles"
    locationVariations[3], // "the Los Angeles area"
    locationVariations[1], // "LA"
  ]

  return PROMPT_TEMPLATES.map((template, index) => {
    const locationVar = locationMap[index] || locationVariations[0]

    return template
      .replace('{service}', vars.service)
      .replace('{business_type}', vars.business_type)
      .replace('{business_types}', vars.business_types)
      .replace('{action}', vars.action)
      .replace('{location}', locationVar)
  })
}
