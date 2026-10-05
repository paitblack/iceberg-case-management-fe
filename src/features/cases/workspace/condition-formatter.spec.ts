import { describe, it, expect } from 'vitest';
import { formatConditionToNaturalLanguage } from './condition-formatter';

describe('formatConditionToNaturalLanguage', () => {
  it('translates cash buyer / chainPosition condition into clear agent text', () => {
    expect(
      formatConditionToNaturalLanguage("chainPosition != 'Investor Cash Buyer'"),
    ).toBe('Required for non-cash buyers (mortgage purchase)');

    expect(
      formatConditionToNaturalLanguage("chainPosition !== 'Investor Cash Buyer'"),
    ).toBe('Required for non-cash buyers (mortgage purchase)');

    expect(
      formatConditionToNaturalLanguage("chainPosition == 'Investor Cash Buyer'"),
    ).toBe('Applicable for cash buyers only');
  });

  it('translates mortgageRequired boolean condition into clear agent text', () => {
    expect(formatConditionToNaturalLanguage('mortgageRequired == true')).toBe(
      'Required when purchasing with a mortgage',
    );
    expect(formatConditionToNaturalLanguage('mortgageRequired == false')).toBe(
      'Applicable for cash buyers only',
    );
    expect(formatConditionToNaturalLanguage('hasMortgage === true')).toBe(
      'Required when purchasing with a mortgage',
    );
  });

  it('translates tenure conditions into clear agent text', () => {
    expect(
      formatConditionToNaturalLanguage("propertyTenure == 'Leasehold'"),
    ).toBe('Required for Leasehold properties only');
    expect(
      formatConditionToNaturalLanguage("tenure == 'Freehold'"),
    ).toBe('Required for Freehold properties only');
  });

  it('translates chain-free conditions into clear agent text', () => {
    expect(formatConditionToNaturalLanguage('isChainFree == true')).toBe(
      'Applicable for chain-free purchases only',
    );
    expect(formatConditionToNaturalLanguage('isChainFree == false')).toBe(
      'Required when transaction is part of a chain',
    );
  });

  it('translates numeric comparison conditions nicely', () => {
    expect(formatConditionToNaturalLanguage('agreedPrice >= 500000')).toBe(
      'Required when Agreed Price is at least 500,000',
    );
    expect(formatConditionToNaturalLanguage('price < 250000')).toBe(
      'Required when Price is less than 250,000',
    );
  });

  it('handles compound && and || conditions', () => {
    const compound = formatConditionToNaturalLanguage(
      "mortgageRequired == true && propertyTenure == 'Leasehold'",
    );
    expect(compound).toContain('Required when purchasing with a mortgage');
    expect(compound).toContain('Required for Leasehold properties only');
  });

  it('returns empty string when condition is empty or invalid', () => {
    expect(formatConditionToNaturalLanguage('')).toBe('');
    expect(formatConditionToNaturalLanguage(null as unknown as string)).toBe('');
  });
});
