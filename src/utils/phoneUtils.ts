/**
 * Utility functions for smart phone number validation, parsing, and formatting.
 * Supports multiple phone numbers separated by comma, slash, space, or newline.
 */

// Sanitizes phone input on typing: allows digits, dashes, commas, slashes, plus, and spaces
export const sanitizePhoneInput = (input: string): string => {
  return input.replace(/[^0-9+\-,/\s\n]/g, '');
};

// Extracts individual clean phone numbers from string
export const parsePhoneNumbers = (phoneString: string): string[] => {
  if (!phoneString) return [];
  // Split by comma, slash, or newline
  const parts = phoneString.split(/[,/\n]+/);
  return parts
    .map(p => p.trim())
    .filter(p => p.length >= 8); // Valid Thai phone is usually 9-10 digits
};

// Formats a phone number for display (e.g. 0812345678 -> 081-234-5678)
export const formatPhoneDisplay = (phone: string): string => {
  const digits = phone.replace(/[^0-9]/g, '');
  if (digits.length === 10) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  if (digits.length === 9) {
    return `${digits.slice(0, 2)}-${digits.slice(2, 5)}-${digits.slice(5)}`;
  }
  return phone;
};
