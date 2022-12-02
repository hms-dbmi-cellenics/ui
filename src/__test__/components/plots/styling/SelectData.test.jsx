import createTestComponentFactory from '__test__/test-utils/testComponentFactory';
import SelectData from 'components/plots/styling/SelectData';
import { render, screen, fireEvent } from '@testing-library/react';

import { initialPlotConfigStates } from 'redux/reducers/componentConfig/initialState';

import mockCellSets from '__test__/data/cell_sets.json';
import { createHierarchyFromTree, createPropertiesFromTree } from 'redux/reducers/cellSets/helpers';
import { act } from 'react-dom/test-utils';

import { plotTypes } from 'utils/constants';

const mockOnUpdate = jest.fn();

const mockCellSetsStore = {
  loading: false,
  initialLoadPending: false,
  accessible: true,
  error: false,
  hierarchy: createHierarchyFromTree(mockCellSets.cellSets),
  properties: createPropertiesFromTree(mockCellSets.cellSets),
};

const defaultProps = {
  onUpdate: mockOnUpdate,
  config: initialPlotConfigStates[plotTypes.DOT_PLOT],
  cellSets: mockCellSetsStore,
};

const selectDataFactory = createTestComponentFactory(SelectData, defaultProps);

describe('Select Data', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('Renders properly', async () => {
    await act(async () => {
      render(selectDataFactory());
    });

    // It has the first dropdown
    expect(screen.getByText(/Select the cell sets or metadata that cells are grouped by/i)).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: 'selectCellSets' }));

    // It has the second dropdown
    expect(screen.getByText(/Select the cell sets or metadata to be shown as data/i)).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: 'selectPoints' }));
  });

  it('Shows a loading screen if cellSets is still loading', async () => {
    let container = null;

    const loadingState = {
      cellSets: {
        loading: true,
        accessible: false,
        initialLoadPending: false,
        error: false,
      },
    };

    await act(async () => {
      const result = await render(
        selectDataFactory(loadingState),
      );
      container = result.container;
    });

    expect(container.querySelectorAll('span[class*=ant-skeleton-input]').length).toEqual(1);
  });

  it('Shows an error message if cellSets is error', async () => {
    const errorState = {
      cellSets: {
        error: true,
        acessible: false,
      },
    };

    await act(async () => {
      render(selectDataFactory(errorState));
    });

    expect(screen.getByText(/Error loading cell set/i)).toBeInTheDocument();
  });

  it('Renders custom texts properly', async () => {
    const firstSelectionText = 'First selection text';
    const secondSelectionText = 'Second selection text';

    await act(async () => {
      render(selectDataFactory({
        firstSelectionText,
        secondSelectionText,
      }));
    });

    expect(screen.getByText(firstSelectionText)).toBeInTheDocument();
    expect(screen.getByText(secondSelectionText)).toBeInTheDocument();
  });

  it('Changing the first option triggers onUpdate ', async () => {
    await act(async () => {
      render(
        selectDataFactory(),
      );
    });

    const firstSelect = screen.getByRole('combobox', { name: 'selectCellSets' });

    await act(async () => {
      fireEvent.change(firstSelect, { target: { value: 'Samples' } });
    });

    const option = screen.getByText(/Samples/);

    await act(async () => {
      fireEvent.click(option);
    });

    expect(mockOnUpdate).toHaveBeenCalledTimes(1);
  });

  it('Changing the second option triggers onUpdate ', async () => {
    await act(async () => {
      render(
        selectDataFactory(),
      );
    });

    const cellSetSelect = screen.getByRole('combobox', { name: 'selectCellSets' });

    // Change to samples so that we can choose Cluster
    await act(async () => {
      fireEvent.change(cellSetSelect, { target: { value: 'Samples' } });
    });

    const cellSetOption = screen.getByText(/Samples/);

    await act(async () => {
      fireEvent.click(cellSetOption);
    });

    const pointsSelect = screen.getByRole('combobox', { name: 'selectPoints' });

    await act(async () => {
      fireEvent.change(pointsSelect, { target: { value: 'All' } });
    });

    const pointOption = screen.getByText(/Cluster 9/);

    await act(async () => {
      fireEvent.click(pointOption);
    });

    expect(mockOnUpdate).toHaveBeenCalledTimes(1);
  });
});
