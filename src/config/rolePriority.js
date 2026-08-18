/**
 * Role Priority Configuration
 * Defines the priority order of roles when a user has multiple roles.
 * Higher number = higher priority (will be displayed/used first)
 */

export const ROLE_PRIORITY = {
  UNIPRIME: 1,
  VICE_CHANCELLOR: 2,
  DY_PRO_CHANCELLOR: 3,
  REGISTRAR: 4,
  PRO_VICE_CHANCELLOR_E_S: 5,
  PRO_VICE_CHANCELLOR_A: 6,
  PRO_VICE_CHANCELLOR_S_P: 7,
  DEAN_IQAC: 8,
  DEAN_ADMISSIONS: 9,
  EXAMSECTION: 10,
  FEEDBACK_COORDINATOR: 11,
  SCHOOL_DEAN: 12,
  HOD: 13,
  RESEARCH_DEAN: 14,
  RESEARCH_COORDINATOR: 15,
  FACULTY: 16,
  STUDENT: 17,
};

/**
 * Get the highest priority role from a list of roles
 * @param {string[] | undefined} roles - Array of role names
 * @returns {string} The highest priority role, or 'STUDENT' as fallback
 */
export const getHighestRole = (roles) => {
  if (!roles || roles.length === 0) {
    return "STUDENT";
  }

  // If only one role, return it
  if (roles.length === 1) {
    return roles[0];
  }

  // Find the role with the highest priority (lowest number)
  let highestRole = roles[0];
  let highestPriority = ROLE_PRIORITY[roles[0]] || Infinity;

  for (let i = 1; i < roles.length; i++) {
    const currentRole = roles[i];
    const currentPriority = ROLE_PRIORITY[currentRole] || Infinity;

    if (currentPriority < highestPriority) {
      highestPriority = currentPriority;
      highestRole = currentRole;
    }
  }

  return highestRole;
};
