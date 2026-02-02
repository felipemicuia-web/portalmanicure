/**
 * Validation utilities for form inputs
 */

/**
 * Normalize phone number by removing non-digits
 */
export function normalizePhone(raw: string): string {
  return raw.replace(/\D/g, "");
}

/**
 * Validate Brazilian phone number format
 * Format: DDD (2 digits: 11-99) + number (8-9 digits)
 * Mobile numbers must start with 9
 */
export function isValidBrazilianPhone(phone: string): boolean {
  const digits = normalizePhone(phone);
  
  // Must be 10 or 11 digits
  if (digits.length < 10 || digits.length > 11) {
    return false;
  }
  
  // DDD must be between 11-99 (first two digits)
  const ddd = parseInt(digits.substring(0, 2), 10);
  if (ddd < 11 || ddd > 99) {
    return false;
  }
  
  // If 11 digits, must be mobile (starts with 9)
  if (digits.length === 11 && digits[2] !== "9") {
    return false;
  }
  
  // Reject obvious invalid patterns
  const numberPart = digits.substring(2);
  if (/^0+$/.test(numberPart) || /^1+$/.test(numberPart)) {
    return false;
  }
  
  return true;
}

/**
 * Format phone for display
 */
export function formatPhone(phone: string): string {
  const digits = normalizePhone(phone);
  
  if (digits.length === 11) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  } else if (digits.length === 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  
  return phone;
}

/**
 * Validate name (minimum 2 characters, no numbers)
 */
export function isValidName(name: string): boolean {
  const trimmed = name.trim();
  return trimmed.length >= 2 && !/\d/.test(trimmed);
}
