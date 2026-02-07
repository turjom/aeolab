'use client'

import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const INDUSTRIES = [
  'Home Renovation/Remodeling',
  'Photography (Wedding, Event, Portrait)',
  'Real Estate Agent (US) / Property Agent (SG)',
  'Plumbing Services',
  'Consulting (Business, Marketing, IT)',
  'Web Design/Development',
  'HVAC Services (US) / Air Conditioning Services (SG)',
  'Landscaping/Lawn Care',
]

const COUNTRIES = ['United States', 'Singapore']

// Prompt templates
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

// Industry mapping
const INDUSTRY_MAPPING: Record<string, { us: { service: string; business_type: string; action: string; business_types: string }, sg: { service: string; business_type: string; action: string; business_types: string } }> = {
  'Home Renovation/Remodeling': {
    us: { service: 'kitchen renovation', business_type: 'contractor', action: 'remodel my kitchen', business_types: 'contractors' },
    sg: { service: 'kitchen renovation', business_type: 'contractor', action: 'renovate my kitchen', business_types: 'contractors' },
  },
  'Photography (Wedding, Event, Portrait)': {
    us: { service: 'wedding photography', business_type: 'photographer', action: 'find a wedding photographer', business_types: 'photographers' },
    sg: { service: 'wedding photography', business_type: 'photographer', action: 'find a wedding photographer', business_types: 'photographers' },
  },
  'Real Estate Agent (US) / Property Agent (SG)': {
    us: { service: 'real estate', business_type: 'agent', action: 'find a real estate agent', business_types: 'agents' },
    sg: { service: 'property', business_type: 'agent', action: 'find a property agent', business_types: 'agents' },
  },
  'Plumbing Services': {
    us: { service: 'plumbing', business_type: 'plumber', action: 'fix a plumbing issue', business_types: 'plumbers' },
    sg: { service: 'plumbing', business_type: 'plumber', action: 'fix a plumbing issue', business_types: 'plumbers' },
  },
  'Consulting (Business, Marketing, IT)': {
    us: { service: 'business consulting', business_type: 'consultant', action: 'hire a business consultant', business_types: 'consultants' },
    sg: { service: 'business consulting', business_type: 'consultant', action: 'hire a business consultant', business_types: 'consultants' },
  },
  'Web Design/Development': {
    us: { service: 'web design', business_type: 'web designer', action: 'build a website', business_types: 'web designers' },
    sg: { service: 'web design', business_type: 'web designer', action: 'build a website', business_types: 'web designers' },
  },
  'HVAC Services (US) / Air Conditioning Services (SG)': {
    us: { service: 'HVAC', business_type: 'HVAC contractor', action: 'repair my HVAC system', business_types: 'HVAC contractors' },
    sg: { service: 'aircon servicing', business_type: 'aircon technician', action: 'service my air conditioning', business_types: 'aircon technicians' },
  },
  'Landscaping/Lawn Care': {
    us: { service: 'landscaping', business_type: 'landscaper', action: 'landscape my yard', business_types: 'landscapers' },
    sg: { service: 'landscaping', business_type: 'landscaper', action: 'landscape my garden', business_types: 'landscapers' },
  },
}

function generateLocationVariations(location: string, country: string): string[] {
  if (country === 'Singapore') {
    return ['Singapore']
  }
  
  // US location variations
  const parts = location.split(',').map(s => s.trim())
  const city = parts[0] || location
  const state = parts[1]?.replace(/[()]/g, '').trim() || ''
  
  // Extract common abbreviations (e.g., "Los Angeles" -> "LA")
  const cityWords = city.split(' ')
  const abbreviation = cityWords.length > 1 
    ? cityWords.map(w => w[0]).join('').toUpperCase()
    : city.substring(0, 2).toUpperCase()
  
  return [
    city, // "Los Angeles"
    abbreviation, // "LA"
    location, // "Los Angeles, CA"
    `the ${city} area`, // "the Los Angeles area"
  ]
}

function generatePrompts(
  industry: string,
  country: string,
  location: string
): string[] {
  const mapping = INDUSTRY_MAPPING[industry]
  if (!mapping) return []

  const vars = country === 'United States' ? mapping.us : mapping.sg
  const locationVariations = generateLocationVariations(location, country)
  
  // Map each template to a specific location variation for variety
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

export default function SetupPage() {
  const [businessName, setBusinessName] = useState('')
  const [industry, setIndustry] = useState('')
  const [country, setCountry] = useState('')
  const [location, setLocation] = useState('')
  const [websiteUrl, setWebsiteUrl] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    // Validation
    if (!businessName.trim()) {
      setError('Business name is required')
      setLoading(false)
      return
    }

    if (!industry) {
      setError('Industry is required')
      setLoading(false)
      return
    }

    if (!country) {
      setError('Country is required')
      setLoading(false)
      return
    }

    let finalLocation = location.trim()
    if (country === 'Singapore') {
      finalLocation = 'Singapore'
    } else if (!finalLocation) {
      setError('Location is required')
      setLoading(false)
      return
    }

    try {
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      
      if (userError || !user) {
        setError('You must be logged in to continue')
        setLoading(false)
        return
      }

      // Calculate next check date (7 days from now)
      const nextCheckDate = new Date()
      nextCheckDate.setDate(nextCheckDate.getDate() + 7)

      // Save business to database
      const { data: business, error: businessError } = await supabase
        .from('businesses')
        .insert({
          user_id: user.id,
          business_name: businessName.trim(),
          industry,
          location: finalLocation,
          website_url: websiteUrl.trim() || null,
          next_check_date: nextCheckDate.toISOString(),
        })
        .select()
        .single()

      if (businessError) {
        setError(businessError.message || 'Failed to save business information')
        setLoading(false)
        return
      }

      if (!business) {
        setError('Failed to create business')
        setLoading(false)
        return
      }

      // Generate prompts
      const prompts = generatePrompts(industry, country, finalLocation)

      // Save prompts to database
      const promptsToInsert = prompts.map(prompt => ({
        business_id: business.id,
        prompt_text: prompt,
        is_active: true,
      }))

      const { error: promptsError } = await supabase
        .from('tracked_prompts')
        .insert(promptsToInsert)

      if (promptsError) {
        setError('Failed to generate prompts. Please try again.')
        setLoading(false)
        return
      }

      // Redirect to review page
      router.push('/dashboard/setup/review')
    } catch (err) {
      setError('An unexpected error occurred. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-2 text-gray-900">Business Setup</h1>
      <p className="text-gray-600 mb-8">
        Tell us about your business so we can start tracking your AI visibility.
      </p>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
            {error}
          </div>
        )}

        {/* Business Name */}
        <div>
          <label htmlFor="businessName" className="block text-sm font-medium text-gray-700 mb-2">
            Business Name <span className="text-red-500">*</span>
          </label>
          <input
            id="businessName"
            type="text"
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-md bg-white text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
            placeholder="e.g., Joe's Kitchen Remodeling"
            disabled={loading}
          />
        </div>

        {/* Industry */}
        <div>
          <label htmlFor="industry" className="block text-sm font-medium text-gray-700 mb-2">
            Industry <span className="text-red-500">*</span>
          </label>
          <select
            id="industry"
            value={industry}
            onChange={(e) => setIndustry(e.target.value)}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-md bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
            disabled={loading}
          >
            <option value="">Select an industry</option>
            {INDUSTRIES.map((ind) => (
              <option key={ind} value={ind}>
                {ind}
              </option>
            ))}
          </select>
        </div>

        {/* Country */}
        <div>
          <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-2">
            Country <span className="text-red-500">*</span>
          </label>
          <select
            id="country"
            value={country}
            onChange={(e) => {
              setCountry(e.target.value)
              if (e.target.value === 'Singapore') {
                setLocation('Singapore')
              } else {
                setLocation('')
              }
            }}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-md bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
            disabled={loading}
          >
            <option value="">Select a country</option>
            {COUNTRIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        {/* Location */}
        <div>
          <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
            Location <span className="text-red-500">*</span>
          </label>
          <input
            id="location"
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            required={country !== 'Singapore'}
            disabled={country === 'Singapore' || loading}
            placeholder={
              country === 'Singapore'
                ? 'Singapore'
                : country === 'United States'
                ? 'City, State (e.g., Los Angeles, CA)'
                : 'Enter your location'
            }
            className="w-full px-4 py-2 border border-gray-300 rounded-md bg-white text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed disabled:text-gray-500"
          />
          {country === 'Singapore' && (
            <p className="mt-1 text-xs text-gray-500">Location is automatically set to Singapore</p>
          )}
        </div>

        {/* Website URL */}
        <div>
          <label htmlFor="websiteUrl" className="block text-sm font-medium text-gray-700 mb-2">
            Website URL <span className="text-gray-400 text-xs">(optional)</span>
          </label>
          <input
            id="websiteUrl"
            type="url"
            value={websiteUrl}
            onChange={(e) => setWebsiteUrl(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md bg-white text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
            placeholder="https://example.com"
            disabled={loading}
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-3 px-4 rounded-md font-semibold hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <span className="flex items-center justify-center">
              <svg
                className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Generating prompts...
            </span>
          ) : (
            'Generate My Tracking Prompts'
          )}
        </button>
      </form>
    </div>
  )
}
