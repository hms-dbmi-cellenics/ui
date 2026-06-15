import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import ColourReverse from 'components/plots/styling/ColourReverse';

const mockOnUpdate = jest.fn();

const renderColourReverse = (config) => render(
  <ColourReverse onUpdate={mockOnUpdate} config={config} />,
);

describe('ColourReverse', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the Standard and Reversed options', () => {
    renderColourReverse({ colour: { reverseCbar: false } });

    expect(screen.getByText('Standard')).toBeInTheDocument();
    expect(screen.getByText('Reversed')).toBeInTheDocument();
  });

  it('reflects reverseCbar=false as Standard selected', () => {
    renderColourReverse({ colour: { reverseCbar: false } });

    const standard = screen.getByRole('radio', { name: 'Standard' });
    expect(standard).toBeChecked();
  });

  it('reflects reverseCbar=true as Reversed selected', () => {
    renderColourReverse({ colour: { reverseCbar: true } });

    const reversed = screen.getByRole('radio', { name: 'Reversed' });
    expect(reversed).toBeChecked();
  });

  it('coerces a truthy non-boolean reverseCbar to the Reversed option', () => {
    renderColourReverse({ colour: { reverseCbar: 1 } });

    expect(screen.getByRole('radio', { name: 'Reversed' })).toBeChecked();
  });

  it('calls onUpdate with reverseCbar=true when Reversed is picked', () => {
    renderColourReverse({ colour: { reverseCbar: false } });

    userEvent.click(screen.getByRole('radio', { name: 'Reversed' }));

    expect(mockOnUpdate).toHaveBeenCalledWith({ colour: { reverseCbar: true } });
  });

  it('calls onUpdate with reverseCbar=false when Standard is picked', () => {
    renderColourReverse({ colour: { reverseCbar: true } });

    userEvent.click(screen.getByRole('radio', { name: 'Standard' }));

    expect(mockOnUpdate).toHaveBeenCalledWith({ colour: { reverseCbar: false } });
  });
});
