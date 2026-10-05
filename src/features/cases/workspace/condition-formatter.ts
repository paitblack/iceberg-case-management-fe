/**
 * Utility to convert programmatic condition rules into clear, estate-agent-friendly natural language.
 */

function humanizeFieldName(name: string): string {
  return name
    .replace(/([A-Z])/g, ' $1')
    .replace(/_/g, ' ')
    .replace(/^\w/, (c) => c.toUpperCase())
    .trim();
}

/**
 * Known UK Real Estate specific mappings for common progression conditions
 */
const KNOWN_EXPRESSIONS: Record<string, string> = {
  'chainposition!=investorcashbuyer':
    'Required for non-cash buyers (mortgage purchase)',
  'chainposition!==investorcashbuyer':
    'Required for non-cash buyers (mortgage purchase)',
  'chainposition==investorcashbuyer': 'Applicable for cash buyers only',
  'chainposition===investorcashbuyer': 'Applicable for cash buyers only',
  'mortgagerequired==true': 'Required when purchasing with a mortgage',
  'mortgagerequired===true': 'Required when purchasing with a mortgage',
  'hasmortgage==true': 'Required when purchasing with a mortgage',
  'hasmortgage===true': 'Required when purchasing with a mortgage',
  'mortgagerequired==false': 'Applicable for cash buyers only',
  'mortgagerequired===false': 'Applicable for cash buyers only',
  'hasmortgage==false': 'Applicable for cash buyers only',
  'hasmortgage===false': 'Applicable for cash buyers only',
  'propertytenure==leasehold': 'Required for Leasehold properties only',
  'propertytenure===leasehold': 'Required for Leasehold properties only',
  'tenure==leasehold': 'Required for Leasehold properties only',
  'tenure===leasehold': 'Required for Leasehold properties only',
  'propertytenure==freehold': 'Required for Freehold properties only',
  'propertytenure===freehold': 'Required for Freehold properties only',
  'tenure==freehold': 'Required for Freehold properties only',
  'tenure===freehold': 'Required for Freehold properties only',
  'ischainfree==true': 'Applicable for chain-free purchases only',
  'ischainfree===true': 'Applicable for chain-free purchases only',
  'ischainfree==false': 'Required when transaction is part of a chain',
  'ischainfree===false': 'Required when transaction is part of a chain',
};

function formatAtomicCondition(expr: string): string {
  const trimmed = expr.trim();
  const normalized = trimmed.toLowerCase().replace(/\s+/g, '').replace(/["']/g, '');

  if (KNOWN_EXPRESSIONS[normalized]) {
    return KNOWN_EXPRESSIONS[normalized];
  }

  // Regex match: field operator value
  const match = trimmed.match(
    /^([a-zA-Z_][a-zA-Z0-9_]*)\s*(==|===|!=|!==|>=|<=|>|<)\s*(.+)$/,
  );
  if (!match) {
    return trimmed;
  }

  const [, rawField, op, rawVal] = match;
  if (!rawField || !op || !rawVal) {
    return trimmed;
  }

  const field = humanizeFieldName(rawField);
  const cleanVal = rawVal.replace(/^['"]|['"]$/g, '').trim();

  if (cleanVal.toLowerCase() === 'true') {
    if (op === '==' || op === '===') {
      return `Required when ${field} is applicable`;
    }
    if (op === '!=' || op === '!==') {
      return `Required when ${field} is not applicable`;
    }
  }

  if (cleanVal.toLowerCase() === 'false') {
    if (op === '==' || op === '===') {
      return `Required when ${field} is not applicable`;
    }
    if (op === '!=' || op === '!==') {
      return `Required when ${field} is applicable`;
    }
  }

  const numericVal = Number(cleanVal);
  const formattedVal = !isNaN(numericVal) && cleanVal !== ''
    ? Number(cleanVal).toLocaleString('en-GB')
    : cleanVal;

  switch (op) {
    case '==':
    case '===':
      return `Required when ${field} is ${formattedVal}`;
    case '!=':
    case '!==':
      return `Required unless ${field} is ${formattedVal}`;
    case '>=':
      return `Required when ${field} is at least ${formattedVal}`;
    case '<=':
      return `Required when ${field} is at most ${formattedVal}`;
    case '>':
      return `Required when ${field} is greater than ${formattedVal}`;
    case '<':
      return `Required when ${field} is less than ${formattedVal}`;
    default:
      return trimmed;
  }
}

/**
 * Formats a conditional expression (including && / || compounds) into natural language.
 */
export function formatConditionToNaturalLanguage(condition: string): string {
  if (!condition || typeof condition !== 'string') {
    return '';
  }

  const trimmed = condition.trim();

  // Check full expression first
  const normalizedFull = trimmed.toLowerCase().replace(/\s+/g, '').replace(/["']/g, '');
  if (KNOWN_EXPRESSIONS[normalizedFull]) {
    return KNOWN_EXPRESSIONS[normalizedFull];
  }

  // Handle && compound
  if (trimmed.includes('&&')) {
    const parts = trimmed.split('&&').map((p) => formatAtomicCondition(p));
    return parts.join(' and ');
  }

  // Handle || compound
  if (trimmed.includes('||')) {
    const parts = trimmed.split('||').map((p) => formatAtomicCondition(p));
    return parts.join(' or ');
  }

  return formatAtomicCondition(trimmed);
}
