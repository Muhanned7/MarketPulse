const SECTOR_KEYWORDS = {
    Technology: [
      'tech', 'ai', 'chip', 'semiconductor', 'software', 'nvidia', 
      'apple', 'microsoft', 'google', 'meta', 'amazon', 'cloud', 
      'cyber', 'openai', 'robot', 'hardware', 'computing'
    ],
    Energy: [
      'oil', 'gas', 'energy', 'opec', 'crude', 'solar', 'wind', 
      'battery', 'ev', 'climate', 'carbon', 'fuel', 'lng', 'refin',
      'renewable', 'nuclear'
    ],
    Financials: [
      'fed', 'rate', 'bank', 'finance', 'invest', 'bond', 'yield', 
      'inflation', 'gdp', 'ecb', 'jpmorgan', 'goldman', 'credit',
      'interest', 'monetary', 'lending', 'debt'
    ],
    Healthcare: [
      'drug', 'pharma', 'health', 'fda', 'biotech', 'vaccine', 
      'trial', 'medical', 'pfizer', 'moderna', 'cancer', 'gene',
      'clinical', 'therapy', 'patent'
    ],
    Consumer: [
      'retail', 'consumer', 'walmart', 'iphone', 'spend', 
      'sales', 'revenue', 'ecommerce', 'shopping', 'brand',
      'luxury', 'food', 'beverage'
    ],
    Macro: [
      'inflation', 'gdp', 'trade', 'tariff', 'china', 'recession', 
      'growth', 'employ', 'job', 'treasury', 'dollar', 'currency',
      'geopolit', 'sanction', 'export', 'import'
    ]
  }

  export function tagSectors(text){
    
    if (!text) return ['Macro']

    const lower = text.toLowerCase()

    

    const matched = Object.entries(SECTOR_KEYWORDS).filter(([sector, keywords])=> keywords.some(keyword => {const regex = new RegExp(`\\b${keyword}`, 'i')
    return regex.test(text)})).map(([sector])=> sector)
    // if nothing matched, default to Macro
    return matched.length > 0 ? matched : ['Macro']

  }

