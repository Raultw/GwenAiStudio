export interface PasswordPolicyCheckItem {
  id: string;
  label: string;
  passed: boolean;
}

export interface PasswordPolicyValidationResult {
  valid: boolean;
  error?: string;
}

export const FORBIDDEN_SEQUENCES: readonly string[] = [
  '0123', '1234', '2345', '3456', '4567', '5678', '6789',
  '9876', '8765', '7654', '6543', '5432', '4321', '3210'
];

export const FORBIDDEN_SEQUENCES_REGEX = /(?:0123|1234|2345|3456|4567|5678|6789|9876|8765|7654|6543|5432|4321|3210)/;

/**
 * Validates a password against the shared personal password policy:
 * - 8-16 characters
 * - At least one lowercase letter
 * - At least one uppercase letter
 * - At least one digit
 * - At least one non-whitespace symbol
 * - No 4-digit ascending or descending consecutive sequences (0123..6789 and 9876..3210; not 7890)
 *
 * Does not trim passwords and does not expose secrets.
 */
export function validatePasswordPolicy(pass: string): PasswordPolicyValidationResult {
  if (!pass || typeof pass !== 'string') {
    return { valid: false, error: 'Contraseña requerida.' };
  }
  if (/^\s+$/.test(pass)) {
    return { valid: false, error: 'La contraseña no puede consistir únicamente en espacios.' };
  }
  if (pass.length < 8) {
    return { valid: false, error: 'La contraseña debe tener al menos 8 caracteres.' };
  }
  if (pass.length > 16) {
    return { valid: false, error: 'La contraseña no puede exceder los 16 caracteres.' };
  }
  if (!/[a-z]/.test(pass)) {
    return { valid: false, error: 'La contraseña debe contener al menos una letra minúscula.' };
  }
  if (!/[A-Z]/.test(pass)) {
    return { valid: false, error: 'La contraseña debe contener al menos una letra mayúscula.' };
  }
  if (!/[0-9]/.test(pass)) {
    return { valid: false, error: 'La contraseña debe contener al menos un número.' };
  }
  if (!/[^a-zA-Z0-9\s]/.test(pass)) {
    return { valid: false, error: 'La contraseña debe contener al menos un símbolo especial.' };
  }
  if (FORBIDDEN_SEQUENCES_REGEX.test(pass)) {
    return { valid: false, error: 'La contraseña no puede contener secuencias de cuatro números consecutivos.' };
  }
  return { valid: true };
}

/**
 * Returns a checklist with id, label in Spanish, and passed status for each policy rule.
 * Does not trim passwords and does not expose secrets.
 */
export function getPasswordPolicyChecklist(pass: string): PasswordPolicyCheckItem[] {
  const isString = typeof pass === 'string';
  const safePass = isString ? pass : '';

  return [
    {
      id: 'length',
      label: 'Entre 8 y 16 caracteres',
      passed: isString && safePass.length >= 8 && safePass.length <= 16
    },
    {
      id: 'uppercase',
      label: 'Al menos una letra mayúscula',
      passed: isString && /[A-Z]/.test(safePass)
    },
    {
      id: 'lowercase',
      label: 'Al menos una letra minúscula',
      passed: isString && /[a-z]/.test(safePass)
    },
    {
      id: 'digit',
      label: 'Al menos un dígito',
      passed: isString && /[0-9]/.test(safePass)
    },
    {
      id: 'symbol',
      label: 'Al menos un símbolo (no espacio)',
      passed: isString && /[^a-zA-Z0-9\s]/.test(safePass)
    },
    {
      id: 'no-sequences',
      label: 'Sin secuencias de 4 números consecutivos',
      passed: isString && !FORBIDDEN_SEQUENCES_REGEX.test(safePass)
    }
  ];
}

export const getPasswordChecklist = getPasswordPolicyChecklist;
export const passwordPolicyChecklist = getPasswordPolicyChecklist;
export const passwordChecklist = getPasswordPolicyChecklist;

export function checkPasswordPolicy(pass: string): PasswordPolicyValidationResult & { checklist: PasswordPolicyCheckItem[] } {
  const validation = validatePasswordPolicy(pass);
  const checklist = getPasswordPolicyChecklist(pass);
  return {
    ...validation,
    checklist
  };
}

export default {
  validatePasswordPolicy,
  getPasswordPolicyChecklist,
  getPasswordChecklist,
  passwordPolicyChecklist,
  passwordChecklist,
  checkPasswordPolicy,
  FORBIDDEN_SEQUENCES,
  FORBIDDEN_SEQUENCES_REGEX
};
