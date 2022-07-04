import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';

import fake from '__test__/test-utils/constants';
import HeatmapControls from 'components/plots/styling/heatmap/HeatmapControls';

describe('Heatmap Controls test', () => {
  const onGeneEnter = jest.fn();
  const onReset = jest.fn();
  const renderHeatmapControls = (selectedGenes) => {
    render(<HeatmapControls
      onGeneEnter={onGeneEnter}
      plotUuid={fake.EXPERIMENT_ID}
      selectedGenes={selectedGenes}
      onReset={onReset}
    />);
  };

  it('Renders correctly', () => {
    const selectedGenes = ['someMockGene'];
    renderHeatmapControls(selectedGenes);
    expect(screen.getByText(/Type in a gene name and hit space or enter to add it to the heatmap./i)).toBeInTheDocument();
    expect(screen.getByText(/Reset/i)).toBeInTheDocument();
    expect(screen.getByText('someMockGene')).toBeInTheDocument();
  });

  it('reset button works', () => {
    const selectedGenes = ['someMockGene', 'anotherone'];
    renderHeatmapControls(selectedGenes);
    userEvent.click(screen.getByText('Reset'));
    expect(onReset).toHaveBeenCalled();
  });
});
