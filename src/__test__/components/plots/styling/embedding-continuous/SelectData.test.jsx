import React from 'react';
import { render, screen } from '@testing-library/react';
import { act } from 'react-dom/test-utils';
import userEvent from '@testing-library/user-event';

import SelectData from 'components/plots/styling/embedding-continuous/SelectData';
import { createHierarchyFromTree, createPropertiesFromTree } from 'redux/reducers/cellSets/helpers';
import { plotTypes } from 'utils/constants';

import mockCellSets from '__test__/data/cell_sets.json';

const mockOnUpdate = jest.fn();

const cellSetsStore = {
  accessible: true,
  error: false,
  hierarchy: createHierarchyFromTree(mockCellSets.cellSets),
  properties: createPropertiesFromTree(mockCellSets.cellSets),
};

// First metadataCategorical parent is 'sample'; grab its first child key.
const firstSampleKey = createHierarchyFromTree(mockCellSets.cellSets)
  .find(({ key }) => key === 'sample').children[0].key;

const renderSelectData = ({
  config = { selectedSample: null },
  cellSets = cellSetsStore,
  plotType = null,
} = {}) => render(
  <SelectData
    onUpdate={mockOnUpdate}
    config={config}
    cellSets={cellSets}
    plotType={plotType}
  />,
);

describe('embedding-continuous SelectData', () => {
  beforeEach(() => jest.clearAllMocks());

  it('uses the non-spatial label and offers an All option by default', async () => {
    await act(async () => { renderSelectData(); });

    expect(screen.getByText('Included Samples:')).toBeInTheDocument();
    // no Toggle Image control for non-spatial
    expect(screen.queryByText('Toggle Image:')).not.toBeInTheDocument();
  });

  it('uses the spatial label and a Toggle Image control for spatial plot types', async () => {
    await act(async () => {
      renderSelectData({ plotType: plotTypes.SPATIAL_FEATURE });
    });

    expect(screen.getByText('Selected sample:')).toBeInTheDocument();
    expect(screen.getByText('Toggle Image:')).toBeInTheDocument();
  });

  it('auto-populates the selected sample with the first sample for spatial plots', async () => {
    await act(async () => {
      renderSelectData({
        plotType: plotTypes.SPATIAL_FEATURE,
        config: { selectedSample: null },
      });
    });

    // The combobox shows the first sample's display name (no 'All' for spatial).
    const sampleName = cellSetsStore.properties[firstSampleKey].name;
    expect(screen.getByText(sampleName)).toBeInTheDocument();
    expect(screen.queryByText('All')).not.toBeInTheDocument();
  });

  it('toggling the image dispatches showImage via onUpdate', async () => {
    await act(async () => {
      renderSelectData({ plotType: plotTypes.SPATIAL_FEATURE });
    });

    userEvent.click(screen.getByRole('radio', { name: 'Hide' }));

    expect(mockOnUpdate).toHaveBeenCalledWith({ showImage: false });
  });

  it('shows an error message when cellSets failed to load', async () => {
    await act(async () => {
      renderSelectData({ cellSets: { ...cellSetsStore, error: true } });
    });

    expect(screen.getByText(/Error loading cell set/i)).toBeInTheDocument();
  });
});
