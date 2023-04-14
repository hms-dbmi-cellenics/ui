import React from 'react';

import { act } from 'react-dom/test-utils';
import userEvent from '@testing-library/user-event';
import { render, screen } from '@testing-library/react';

import HeatmapSettings from 'components/data-exploration/heatmap/HeatmapSettings';

jest.mock('components/data-exploration/heatmap/HeatmapMetadataTrackSettings', () => () => (<div />));
jest.mock('components/data-exploration/heatmap/HeatmapGroupBySettings', () => () => (<div />));

describe('HeatmapSettings', () => {
  it('Renders correctly', async () => {
    await act(async () => {
      render(
        <HeatmapSettings
          componentType='componentType'
        />,
      );
    });

    const dropdown = screen.getByRole('button');
    userEvent.click(dropdown);

    screen.getByText(/Metadata tracks/);
    screen.getByText(/Group by/);
  });
});
