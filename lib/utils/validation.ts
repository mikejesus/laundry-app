// Nigerian phone number validation
export function validateNigerianPhone(phone: string): { valid: boolean; message?: string } {
  // Remove all spaces, dashes, and other non-digit characters except +
  const cleaned = phone.replace(/[\s\-()]/g, '');

  // Nigerian phone patterns:
  // +234XXXXXXXXXX (13 chars)
  // 234XXXXXXXXXX (12 chars)
  // 0XXXXXXXXXX (11 chars starting with 0)
  // XXXXXXXXXX (10 chars without leading 0)

  // Pattern 1: +234XXXXXXXXXX
  if (/^\+234[7-9][0-9]{9}$/.test(cleaned)) {
    return { valid: true };
  }

  // Pattern 2: 234XXXXXXXXXX
  if (/^234[7-9][0-9]{9}$/.test(cleaned)) {
    return { valid: true };
  }

  // Pattern 3: 0XXXXXXXXXX (most common format)
  if (/^0[7-9][0-9]{9}$/.test(cleaned)) {
    return { valid: true };
  }

  // Pattern 4: XXXXXXXXXX (without leading 0)
  if (/^[7-9][0-9]{9}$/.test(cleaned)) {
    return { valid: true };
  }

  return {
    valid: false,
    message: 'Invalid Nigerian phone number. Format: 080XXXXXXXX, +234XXXXXXXXXX, or 234XXXXXXXXXX'
  };
}

// Format phone number to standard format
export function formatNigerianPhone(phone: string): string {
  const cleaned = phone.replace(/[\s\-()]/g, '');

  // Convert to standard Nigerian format (0XXXXXXXXXX)
  if (cleaned.startsWith('+234')) {
    return '0' + cleaned.slice(4);
  } else if (cleaned.startsWith('234')) {
    return '0' + cleaned.slice(3);
  } else if (cleaned.startsWith('0')) {
    return cleaned;
  } else if (/^[7-9]/.test(cleaned)) {
    return '0' + cleaned;
  }

  return cleaned;
}

// Validate email
export function validateEmail(email: string): { valid: boolean; message?: string } {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailRegex.test(email)) {
    return {
      valid: false,
      message: 'Invalid email address'
    };
  }

  return { valid: true };
}
