/**
 * Role Priority Configuration
 * Defines the priority order of roles when a user has multiple roles.
 * Higher number = higher priority (will be displayed/used first)
 */

export const ROLE_PRIORITY = {
  UNIPRIME: 1,
  EXAMSECTION: 2,
  HOD: 3,
  "RESEARCH FEEDBACK COMMITTEE": 4,
  FACULTY: 5,
  STUDENT: 6,
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
