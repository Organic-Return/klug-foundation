/**
 * Cloze CRM Integration Library
 *
 * This library provides methods to interact with the Cloze CRM API.
 * Documentation: https://help.cloze.com/category/1651-api
 *
 * To get an API key, email support@cloze.com with your integration plans.
 */

const CLOZE_API_BASE_URL = 'https://api.cloze.com/v1';

interface ClozeEmail {
  value: string;
  work?: boolean;
}

interface ClozePhone {
  value: string;
  work?: boolean;
}

interface ClozeAddress {
  street?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
}

export interface ClozeContact {
  name: string;
  emails?: ClozeEmail[];
  phones?: ClozePhone[];
  addresses?: ClozeAddress[];
  stage?: 'lead' | 'current' | 'past' | 'none';
  segment?: string;
  about?: string;
  customFields?: Record<string, string>;
}

export interface ClozeNote {
  personId?: string;
  email?: string;
  content: string;
  subject?: string;
}

export interface ClozeCommunication {
  type: 'call' | 'text' | 'meeting' | 'email' | 'direct_message';
  personId?: string;
  email?: string;
  subject?: string;
  content?: string;
  direction?: 'inbound' | 'outbound';
  timestamp?: string;
}

interface ClozeApiResponse {
  errorcode: number;
  message?: string;
  id?: string;
  [key: string]: unknown;
}

class ClozeApiError extends Error {
  constructor(
    message: string,
    public errorCode: number,
    public response?: ClozeApiResponse
  ) {
    super(message);
    this.name = 'ClozeApiError';
  }
}

/**
 * Get the Cloze API key from environment variables
 */
function getApiKey(): string {
  const apiKey = process.env.CLOZE_API_KEY;
  if (!apiKey) {
    throw new Error('CLOZE_API_KEY environment variable is not set');
  }
  return apiKey;
}

/**
 * Get the Cloze user email from environment variables
 * This is required for API requests
 */
function getUserEmail(): string {
  const userEmail = process.env.CLOZE_USER_EMAIL;
  if (!userEmail) {
    throw new Error('CLOZE_USER_EMAIL environment variable is not set');
  }
  return userEmail;
}

/**
 * Make an authenticated request to the Cloze API
 */
async function clozeRequest<T = ClozeApiResponse>(
  endpoint: string,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'POST',
  body?: Record<string, unknown>
): Promise<T> {
  const apiKey = getApiKey();
  const userEmail = getUserEmail();

  const url = `${CLOZE_API_BASE_URL}${endpoint}`;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  // Cloze uses query params for auth
  const urlWithAuth = new URL(url);
  urlWithAuth.searchParams.set('user', userEmail);
  urlWithAuth.searchParams.set('api_key', apiKey);

  const options: RequestInit = {
    method,
    headers,
  };

  if (body && method !== 'GET') {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(urlWithAuth.toString(), options);

  if (!response.ok) {
    throw new ClozeApiError(
      `Cloze API request failed: ${response.status} ${response.statusText}`,
      response.status
    );
  }

  const data = await response.json() as T;

  // Check for Cloze-specific error code
  if (typeof data === 'object' && data !== null && 'errorcode' in data) {
    const apiResponse = data as ClozeApiResponse;
    if (apiResponse.errorcode !== 0) {
      throw new ClozeApiError(
        apiResponse.message || 'Cloze API returned an error',
        apiResponse.errorcode,
        apiResponse
      );
    }
  }

  return data;
}

/**
 * Create or update a contact/person in Cloze
 */
export async function createContact(contact: ClozeContact): Promise<ClozeApiResponse> {
  return clozeRequest('/people/create', 'POST', {
    name: contact.name,
    emails: contact.emails,
    phones: contact.phones,
    addresses: contact.addresses,
    stage: contact.stage || 'lead',
    segment: contact.segment,
    about: contact.about,
    ...contact.customFields,
  });
}

/**
 * Update an existing contact in Cloze
 */
export async function updateContact(
  identifier: { email?: string; personId?: string },
  updates: Partial<ClozeContact>
): Promise<ClozeApiResponse> {
  return clozeRequest('/people/update', 'POST', {
    ...identifier,
    ...updates,
  });
}

/**
 * Add a note to a contact in Cloze
 */
export async function addNote(note: ClozeNote): Promise<ClozeApiResponse> {
  return clozeRequest('/content/add', 'POST', {
    type: 'note',
    person: note.personId,
    email: note.email,
    content: note.content,
    subject: note.subject,
  });
}

/**
 * Add a communication record (call, text, meeting, etc.) to Cloze
 */
export async function addCommunication(comm: ClozeCommunication): Promise<ClozeApiResponse> {
  return clozeRequest('/communications/add', 'POST', {
    type: comm.type,
    person: comm.personId,
    email: comm.email,
    subject: comm.subject,
    content: comm.content,
    direction: comm.direction || 'inbound',
    timestamp: comm.timestamp || new Date().toISOString(),
  });
}

/**
 * Get contact segments available in Cloze
 */
export async function getContactSegments(): Promise<ClozeApiResponse> {
  return clozeRequest('/segments/people', 'GET');
}

/**
 * Get contact stages available in Cloze
 */
export async function getContactStages(): Promise<ClozeApiResponse> {
  return clozeRequest('/stages/people', 'GET');
}

/**
 * Create a project/deal in Cloze
 */
export async function createProject(project: {
  name: string;
  segment?: string;
  stage?: string;
  value?: number;
  personId?: string;
  email?: string;
}): Promise<ClozeApiResponse> {
  return clozeRequest('/projects/create', 'POST', project);
}

/**
 * Utility function to create a lead from a website form submission
 * This is a convenience wrapper for common real estate lead capture use cases
 */
export async function createLeadFromForm(formData: {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  message?: string;
  propertyInterest?: string;
  source?: string;
}): Promise<ClozeApiResponse> {
  const fullName = `${formData.firstName} ${formData.lastName}`.trim();

  // Create the contact
  const contactResponse = await createContact({
    name: fullName,
    emails: [{ value: formData.email, work: false }],
    phones: formData.phone ? [{ value: formData.phone, work: false }] : undefined,
    stage: 'lead',
    about: formData.source ? `Lead source: ${formData.source}` : undefined,
  });

  // If there's a message, add it as a note
  if (formData.message) {
    const noteContent = formData.propertyInterest
      ? `Property Interest: ${formData.propertyInterest}\n\nMessage: ${formData.message}`
      : formData.message;

    await addNote({
      email: formData.email,
      content: noteContent,
      subject: 'Website Inquiry',
    });
  }

  return contactResponse;
}

/**
 * Check if Cloze integration is configured
 */
export function isClozeConfigured(): boolean {
  return !!(process.env.CLOZE_API_KEY && process.env.CLOZE_USER_EMAIL);
}
