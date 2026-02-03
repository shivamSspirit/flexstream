import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');

  if (!url) {
    return NextResponse.json({ error: 'URL is required' }, { status: 400 });
  }

  try {
    console.log('Link preview API called with URL:', url);
    
    // Validate URL
    const urlObj = new URL(url);
    
    // Only allow http and https protocols
    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      throw new Error('Invalid protocol. Only HTTP and HTTPS are allowed.');
    }
    
    // Fetch the webpage with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Flexit/1.0)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate',
        'Connection': 'keep-alive',
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const html = await response.text();
    console.log('Successfully fetched HTML, length:', html.length);
    
    // Parse Open Graph and meta tags
    const ogData = parseOpenGraphData(html, url);
    console.log('Parsed OG data:', ogData);
    
    return NextResponse.json(ogData);
  } catch (error) {
    console.error('Error fetching link preview:', error);
    
    // Return basic preview with domain
    try {
      const domain = new URL(url).hostname;
      return NextResponse.json({
        title: domain,
        description: 'Link preview unavailable',
        image: '',
        url,
        domain,
      });
    } catch (urlError) {
      return NextResponse.json({
        title: 'Invalid URL',
        description: 'Please enter a valid URL',
        image: '',
        url,
        domain: 'invalid',
      });
    }
  }
}

function parseOpenGraphData(html: string, url: string) {
  const domain = new URL(url).hostname;
  
  // Extract meta tags with more flexible regex patterns
  const titleMatch = html.match(/<meta[^>]*(?:property|name)=["']og:title["'][^>]*content=["']([^"']*)["'][^>]*>/i) ||
                    html.match(/<meta[^>]*content=["']([^"']*)["'][^>]*(?:property|name)=["']og:title["'][^>]*>/i) ||
                    html.match(/<title[^>]*>([^<]*)<\/title>/i);
  
  const descriptionMatch = html.match(/<meta[^>]*(?:property|name)=["']og:description["'][^>]*content=["']([^"']*)["'][^>]*>/i) ||
                          html.match(/<meta[^>]*content=["']([^"']*)["'][^>]*(?:property|name)=["']og:description["'][^>]*>/i) ||
                          html.match(/<meta[^>]*(?:property|name)=["']description["'][^>]*content=["']([^"']*)["'][^>]*>/i) ||
                          html.match(/<meta[^>]*content=["']([^"']*)["'][^>]*(?:property|name)=["']description["'][^>]*>/i);
  
  const imageMatch = html.match(/<meta[^>]*(?:property|name)=["']og:image["'][^>]*content=["']([^"']*)["'][^>]*>/i) ||
                    html.match(/<meta[^>]*content=["']([^"']*)["'][^>]*(?:property|name)=["']og:image["'][^>]*>/i);
  
  let title = titleMatch ? titleMatch[1].trim() : domain;
  let description = descriptionMatch ? descriptionMatch[1].trim() : 'No description available';
  let image = imageMatch ? imageMatch[1].trim() : '';

  // Clean up the extracted data
  title = title.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"');
  description = description.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"');
  
  // Make image URL absolute if it's relative
  if (image && !image.startsWith('http')) {
    try {
      image = new URL(image, url).href;
    } catch (e) {
      image = '';
    }
  }

  // Truncate long descriptions
  if (description.length > 200) {
    description = description.substring(0, 200) + '...';
  }

  return {
    title: title || domain,
    description: description || 'No description available',
    image: image || '',
    url,
    domain,
  };
}
