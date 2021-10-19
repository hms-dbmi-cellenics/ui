import React from 'react';

import { act } from 'react-dom/test-utils';
import userEvent from '@testing-library/user-event';
import * as rtl from '@testing-library/react';
import '__test__/test-utils/setupTests';

import HeatmapSettings from 'components/data-exploration/heatmap/HeatmapSettings';

jest.mock('components/data-exploration/heatmap/HeatmapMetadataTrackSettings', () => () => (<div />));
jest.mock('components/data-exploration/heatmap/HeatmapGroupBySettings', () => () => (<div />));
jest.mock('components/data-exploration/heatmap/HeatmapExpressionValuesSettings', () => () => (<div />));
jest.mock('components/data-exploration/heatmap/HeatmapLegendVisibilitySettings', () => () => (<div />));

describe('HeatmapSettings', () => {
  it('Renders correctly', async () => {
    await act(async () => {
      rtl.render(
        <HeatmapSettings
          componentType='componentType'
        />,
      );
    });

    const dropdown = rtl.screen.getByRole('button');
    userEvent.click(dropdown);

    rtl.screen.getByText(/Expression values/);
    rtl.screen.getByText(/Legend/);
    rtl.screen.getByText(/Metadata tracks.../);
    rtl.screen.getByText(/Group by/);
  });
});
