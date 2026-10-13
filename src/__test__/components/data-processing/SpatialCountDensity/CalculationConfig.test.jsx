import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '__test__/test-utils/setupTests';

import CalculationConfig from 'components/data-processing/SpatialCountDensity/CalculationConfig';

const config = {
  nmads: 3, filterControls: true, maxControlPercent: 5, binStep: 0.05,
};

describe('Count density CalculationConfig', () => {
  it('shows the counts/µm² cut for the current threshold', () => {
    render(<CalculationConfig config={config} threshold={Math.log(0.2)} />);

    expect(screen.getByText('Removes cells below 0.200 counts/µm²')).toBeInTheDocument();
  });

  it('hides the cut before QC has run', () => {
    render(<CalculationConfig config={config} />);

    expect(screen.queryByText(/Removes cells below/)).not.toBeInTheDocument();
  });

  it('toggles control filtering', () => {
    const updateSettings = jest.fn();
    render(<CalculationConfig config={config} updateSettings={updateSettings} />);

    userEvent.click(screen.getByRole('switch'));

    expect(updateSettings).toHaveBeenCalledWith({ filterControls: false });
  });

  it('disables the control maximum when control filtering is off', () => {
    render(<CalculationConfig config={{ ...config, filterControls: false }} />);

    const [, maxControlPercent] = screen.getAllByRole('spinbutton');
    expect(maxControlPercent).toBeDisabled();
  });

  it('shows the control maximum as a percent', () => {
    render(<CalculationConfig config={config} />);

    expect(screen.getByText('Max control % of counts')).toBeInTheDocument();
    const [, maxControlPercent] = screen.getAllByRole('spinbutton');
    expect(maxControlPercent).toHaveValue('5.0');
    expect(maxControlPercent).not.toBeDisabled();
  });
});
