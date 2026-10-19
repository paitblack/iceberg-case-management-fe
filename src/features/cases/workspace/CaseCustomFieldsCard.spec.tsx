import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import {
  CaseCustomFieldsCard,
  type CustomFieldDefinitionItem,
} from './CaseCustomFieldsCard';

describe('CaseCustomFieldsCard', () => {
  const sampleCustomFields: CustomFieldDefinitionItem[] = [
    {
      id: 'cf-agreed-price',
      name: 'agreedPrice',
      fieldType: 'number',
      required: true,
    },
    {
      id: 'cf-tenure',
      name: 'propertyTenure',
      fieldType: 'select',
      required: true,
      options: ['Freehold', 'Leasehold', 'Share of Freehold'],
    },
    {
      id: 'cf-mortgage',
      name: 'mortgageRequired',
      fieldType: 'boolean',
      required: false,
    },
    {
      id: 'cf-target-date',
      name: 'targetExchangeDate',
      fieldType: 'date',
      required: false,
    },
  ];

  it('renders custom fields with human-readable labels and controls', () => {
    render(
      <CaseCustomFieldsCard
        customFields={sampleCustomFields}
        fieldValues={{
          agreedPrice: 350000,
          propertyTenure: 'Freehold',
          mortgageRequired: true,
        }}
        onSave={vi.fn()}
      />,
    );

    expect(screen.getByText('Agreed Price')).toBeInTheDocument();
    expect(screen.getByText('Property Tenure')).toBeInTheDocument();
    expect(screen.getByText('Mortgage Required')).toBeInTheDocument();
    expect(screen.getByText('Target Exchange Date')).toBeInTheDocument();

    const priceInput = screen.getByLabelText(/Agreed Price/i) as HTMLInputElement;
    expect(priceInput.value).toBe('350000');

    const tenureSelect = screen.getByLabelText(/Property Tenure/i) as HTMLSelectElement;
    expect(tenureSelect.value).toBe('Freehold');

    const mortgageToggle = screen.getByRole('checkbox', { name: /Mortgage Required/i });
    expect(mortgageToggle).toBeChecked();
  });

  it('allows user to change values and calls onSave with updated payload', async () => {
    const handleSave = vi.fn().mockResolvedValue(undefined);

    render(
      <CaseCustomFieldsCard
        customFields={sampleCustomFields}
        fieldValues={{
          agreedPrice: 350000,
          propertyTenure: 'Freehold',
          mortgageRequired: true,
        }}
        onSave={handleSave}
      />,
    );

    // Toggle mortgage required to false
    const mortgageToggle = screen.getByRole('checkbox', { name: /Mortgage Required/i });
    fireEvent.click(mortgageToggle);
    expect(mortgageToggle).not.toBeChecked();

    // Change price
    const priceInput = screen.getByLabelText(/Agreed Price/i);
    fireEvent.change(priceInput, { target: { value: '425000' } });

    // Click Save
    const saveButton = screen.getByRole('button', { name: /Save Case Criteria/i });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(handleSave).toHaveBeenCalledTimes(1);
      expect(handleSave).toHaveBeenCalledWith({
        agreedPrice: 425000,
        propertyTenure: 'Freehold',
        mortgageRequired: false,
        targetExchangeDate: null,
      });
    });
  });

  it('renders empty placeholder when no custom fields are defined', () => {
    render(
      <CaseCustomFieldsCard
        customFields={[]}
        fieldValues={{}}
        onSave={vi.fn()}
      />,
    );

    expect(
      screen.getByText(/No custom criteria configured for this template/i),
    ).toBeInTheDocument();
  });

  it('renders read-only view when isReadOnly is true', () => {
    render(
      <CaseCustomFieldsCard
        customFields={sampleCustomFields}
        fieldValues={{
          agreedPrice: 500000,
          propertyTenure: 'Leasehold',
          mortgageRequired: false,
        }}
        isReadOnly={true}
        onSave={vi.fn()}
      />,
    );

    expect(screen.queryByRole('button', { name: /Save Case Criteria/i })).not.toBeInTheDocument();
  });
});
