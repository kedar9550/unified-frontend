export const ISSN_REGEX = /^\d{4}-\d{3}[\dX]$/;

/**
 * Automatically formats input to standard ISSN format: \d{4}-\d{3}[\dX]
 * Examples: 1234-5679, 2049-3630, 0028-0836
 */
export const formatIssnInput = (value, prevValue = "") => {
  if (!value) return "";
  const str = String(value).trim();
  
  // Handle backspace when the cursor deletes the hyphen
  if (prevValue && prevValue.endsWith("-") && str === prevValue.slice(0, -1)) {
    return str.slice(0, -1);
  }

  let clean = str.toUpperCase().replace(/[^0-9X]/g, "");

  // 'X' can only be at the 8th position (the check digit)
  if (clean.includes("X")) {
    const chars = clean.split("");
    clean = chars.filter((c, idx) => c !== "X" || idx === 7).join("");
  }

  if (clean.length > 8) clean = clean.slice(0, 8);
  if (clean.length > 4) {
    return `${clean.slice(0, 4)}-${clean.slice(4)}`;
  }
  return clean;
};

/**
 * Validates against ^\d{4}-\d{3}[\dX]$
 */
export const isValidIssn = (val) => {
  if (!val) return false;
  return ISSN_REGEX.test(String(val).trim());
};
