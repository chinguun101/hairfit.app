/**
 * Linkup Search API Integration
 * Documentation: https://docs.linkup.so/pages/documentation/get-started/introduction
 */

export interface LinkupImage {
  url: string;
  title?: string;
  description?: string;
}

export interface LinkupSearchResult {
  name: string;
  type: string;
  url: string;
  content?: string;
}

export interface LinkupSearchResponse {
  results: LinkupSearchResult[];
  images?: LinkupImage[];
}

/**
 * Search for celebrity hairstyle images using Linkup API
 * @param celebrityName The name of the celebrity
 * @param limit Number of images to return (default: 5)
 * @returns Array of image URLs with metadata
 */
export async function searchCelebrityHairstyles(
  celebrityName: string,
  limit: number = 5
): Promise<LinkupImage[]> {
  let apiKey = process.env.LINKUP_API_KEY;
  
  if (!apiKey) {
    throw new Error('LINKUP_API_KEY not configured');
  }
  
  // Remove quotes if present (common issue with .env files)
  apiKey = apiKey.replace(/^["']|["']$/g, '');

  // Craft a specific query for better results
  const query = `${celebrityName} hairstyles different looks hair styles`;
  
  console.log(`Searching Linkup for: ${query}`);

  try {
    // Linkup API endpoint (based on their documentation)
    const response = await fetch('https://api.linkup.so/v1/search', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        q: query,
        depth: 'standard',
        outputType: 'searchResults',
        includeImages: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Linkup API error:', response.status, errorText);
      throw new Error(`Linkup API error: ${response.status} ${response.statusText}`);
    }

    const data: LinkupSearchResponse = await response.json();
    
    console.log(`Linkup returned ${data.results?.length || 0} results`);

    // Extract images from the response
    // Each result in data.results IS an image with url, name, type properties
    let images: LinkupImage[] = [];
    
    if (data.results && data.results.length > 0) {
      // Filter only image type results (exclude GIFs) and map to LinkupImage format
      images = data.results
        .filter(result => 
          result.type === 'image' && 
          result.url && 
          !result.url.toLowerCase().endsWith('.gif')
        )
        .map(result => ({
          url: result.url,
          title: result.name,
          description: result.name,
        }))
        .slice(0, limit);
    }

    // Deduplicate by URL
    const uniqueImages = Array.from(
      new Map(images.map(img => [img.url, img])).values()
    );

    console.log(`Returning ${uniqueImages.length} unique images for ${celebrityName}`);
    
    return uniqueImages;
  } catch (error) {
    console.error(`Error searching for ${celebrityName} hairstyles:`, error);
    throw error;
  }
}

/**
 * Search for multiple celebrities' hairstyles in parallel
 * @param celebrityNames Array of celebrity names
 * @param imagesPerCelebrity Number of images per celebrity (default: 5)
 * @returns Map of celebrity name to their hairstyle images
 */
export async function searchMultipleCelebrityHairstyles(
  celebrityNames: string[],
  imagesPerCelebrity: number = 5
): Promise<Map<string, LinkupImage[]>> {
  console.log(`Searching hairstyles for ${celebrityNames.length} celebrities...`);
  
  const results = await Promise.allSettled(
    celebrityNames.map(name => 
      searchCelebrityHairstyles(name, imagesPerCelebrity)
    )
  );

  const imageMap = new Map<string, LinkupImage[]>();

  results.forEach((result, index) => {
    const celebrityName = celebrityNames[index];
    if (result.status === 'fulfilled') {
      imageMap.set(celebrityName, result.value);
    } else {
      console.error(`Failed to fetch images for ${celebrityName}:`, result.reason);
      imageMap.set(celebrityName, []); // Empty array for failed searches
    }
  });

  return imageMap;
}

