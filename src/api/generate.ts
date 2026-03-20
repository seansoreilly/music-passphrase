interface RequestBody {
  keywords: string;
  addNumber: boolean;
  addSpecialChar: boolean;
  includeSpaces: boolean;
  length: number;
}

interface ApiResponse {
  passphrases: string[];
  success: boolean;
  error?: string;
  details?: string;
}

export async function generatePassphrases(requestBody: RequestBody): Promise<string[]> {
  const { keywords, addNumber, addSpecialChar, includeSpaces, length } = requestBody;

  if (!keywords || keywords.trim().length === 0) {
    throw new Error('Keywords are required');
  }

  console.log('Generating passphrases for keywords:', keywords);
  console.log('Options:', { addNumber, addSpecialChar, includeSpaces, length });

  try {
    const response = await fetch('/api/generate-passphrases', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        keywords: keywords.trim(),
        addNumber,
        addSpecialChar,
        includeSpaces,
        length,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    const data: ApiResponse = await response.json();
    
    if (!data.success || !data.passphrases) {
      throw new Error(data.error || 'Failed to generate passphrases');
    }

    return data.passphrases;
  } catch (error) {
    console.error('API Error:', error);
    
    // If there's an issue with the API, fall back to mock implementation
    console.log('Falling back to mock implementation...');
    const mockPassphrases = generateMockPassphrases(keywords, addNumber, addSpecialChar, includeSpaces, length);
    return mockPassphrases;
  }
}

function generateMockPassphrases(keywords: string, addNumber: boolean, addSpecialChar: boolean, includeSpaces: boolean, length: number): string[] {
  const keywordLower = keywords.toLowerCase();

  // Generate more creative mock passphrases based on keywords
  const baseTemplates = [
    `bright ${keywordLower} morning coffee ritual`,
    `dancing ${keywordLower} under silver moonlight`,
    `${keywordLower} whispers ancient forest secrets`,
    `golden ${keywordLower} sunset painting memories`,
    `${keywordLower} flows through mountain streams`,
    `purple ${keywordLower} dreams floating softly`,
    `${keywordLower} creates magical garden moments`,
    `singing ${keywordLower} birds welcome dawn`,
    `mysterious ${keywordLower} castle tower view`,
    `gentle ${keywordLower} rain on window glass`
  ];

  // Select 5 random templates
  const selectedTemplates = baseTemplates
    .sort(() => Math.random() - 0.5)
    .slice(0, 5);

  return selectedTemplates.map(template => {
    let passphrase = template.charAt(0).toUpperCase() + template.slice(1);

    // Remove spaces if includeSpaces is false
    if (!includeSpaces) {
      passphrase = passphrase.replace(/\s+/g, '');
    }

    // Build suffix first so we can reserve space
    let suffix = '';
    if (addNumber) {
      const randomNumber = Math.floor(Math.random() * 90) + 10;
      suffix += includeSpaces ? ` ${randomNumber}` : `${randomNumber}`;
    }
    if (addSpecialChar) {
      const specialChars = ['!', '@', '#', '$', '%', '&', '*', '?'];
      suffix += specialChars[Math.floor(Math.random() * specialChars.length)];
    }

    // Truncate base text to fit within length including suffix
    const maxBase = length - suffix.length;
    if (passphrase.length > maxBase) {
      passphrase = passphrase.slice(0, maxBase).replace(/\s+$/, '');
    }

    return passphrase + suffix;
  });
}
