import React from 'react';
import {
  render, screen, fireEvent, act,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '__test__/test-utils/setupTests';

import CalculationConfig from 'components/data-processing/SpatialOutlierFilter/CalculationConfig';

const filterSettings = (method, absoluteThreshold = { min: 120, max: null, binStep: 0.05 }) => ({
  method,
  methodSettings: {
    localOutlier: { cutoff: 3, binStep: 0.2 },
    absoluteThreshold,
  },
});

const renderConfig = (props = {}) => {
  const updateSettings = jest.fn();
  render(
    <CalculationConfig
      config={filterSettings('localOutlier')}
      direction='lower'
      metricLabel='UMIs'
      rawRange={[10, 50000]}
      updateSettings={updateSettings}
      // eslint-disable-next-line react/jsx-props-no-spreading
      {...props}
    />,
  );
  return updateSettings;
};

describe('Spatial outlier CalculationConfig', () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  it('shows the z-score threshold for the local-outlier method', () => {
    renderConfig();

    expect(screen.getByText('Z-score threshold')).toBeInTheDocument();
    expect(screen.queryByText('Min')).not.toBeInTheDocument();
  });

  it('switches method with a top-level method diff', () => {
    const updateSettings = renderConfig();

    userEvent.click(screen.getByText('Absolute threshold'));

    expect(updateSettings).toHaveBeenCalledWith({ method: 'absoluteThreshold' });
  });

  it('keeps the method choice usable in automatic mode', () => {
    renderConfig({ disabled: true, stepDisabled: false });

    expect(screen.getByLabelText('Absolute threshold')).not.toBeDisabled();
  });

  it('disables the method choice when the step is disabled', () => {
    renderConfig({ disabled: true, stepDisabled: true });

    expect(screen.getByLabelText('Absolute threshold')).toBeDisabled();
  });

  it('hides the method choice when only one method is allowed', () => {
    renderConfig({
      config: filterSettings('absoluteThreshold'),
      methods: ['absoluteThreshold'],
    });

    expect(screen.queryByText('Local outlier (z-score)')).not.toBeInTheDocument();
    expect(screen.getByText('Min')).toBeInTheDocument();
  });

  it('shows min and an empty (no) max for UMIs and genes', () => {
    renderConfig({ config: filterSettings('absoluteThreshold') });

    const [minInput, maxInput] = screen.getAllByRole('spinbutton');
    expect(minInput).toHaveValue('120');
    expect(maxInput).toHaveValue('');
    expect(maxInput).toHaveAttribute('placeholder', 'none');
  });

  it('writes min and max under methodSettings.absoluteThreshold', () => {
    jest.useFakeTimers();
    const updateSettings = renderConfig({ config: filterSettings('absoluteThreshold') });

    const maxInput = screen.getAllByRole('spinbutton')[1];
    fireEvent.change(maxInput, { target: { value: '5000' } });
    act(() => { jest.runAllTimers(); });

    expect(updateSettings).toHaveBeenLastCalledWith({
      methodSettings: { absoluteThreshold: { min: 120, max: 5000 } },
    });
  });

  it('clearing the max stores null (no upper bound)', () => {
    jest.useFakeTimers();
    const updateSettings = renderConfig({
      config: filterSettings('absoluteThreshold', { min: 120, max: 5000, binStep: 0.05 }),
    });

    const maxInput = screen.getAllByRole('spinbutton')[1];
    fireEvent.change(maxInput, { target: { value: '' } });
    act(() => { jest.runAllTimers(); });

    expect(updateSettings).toHaveBeenLastCalledWith({
      methodSettings: { absoluteThreshold: { min: 120, max: null } },
    });
  });

  it('shows only a max percent for mitochondrial content', () => {
    renderConfig({
      config: filterSettings('absoluteThreshold', { max: 25, binStep: 1 }),
      direction: 'upper',
      metricLabel: 'Mitochondrial %',
    });

    expect(screen.getByText('Max Mitochondrial %')).toBeInTheDocument();
    expect(screen.queryByText('Min')).not.toBeInTheDocument();
    expect(screen.getAllByRole('spinbutton')[0]).toHaveValue('25.0');
  });
});
