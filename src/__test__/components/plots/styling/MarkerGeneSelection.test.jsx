import { screen, render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import React from 'react';

import { act } from 'react-dom/test-utils';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';

import { initialPlotConfigStates } from 'redux/reducers/componentConfig/initialState';
import MarkerGeneSelection from 'components/plots/styling/MarkerGeneSelection';
import createTestComponentFactory from '__test__/test-utils/testComponentFactory';
import { plotTypes } from 'utils/constants';

const mockOnUpdate = jest.fn();
const mockOnReset = jest.fn();
const mockOnGenesChange = jest.fn();

const plotType = plotTypes.DOT_PLOT;

const defaultProps = {
  onUpdate: mockOnUpdate,
  onReset: mockOnReset,
  onGenesChange: mockOnGenesChange,
  onGenesSelect: jest.fn(),
  onSelect: jest.fn(),
  genesToDisable: [],
  plotUuid: 'dotPlotMain',
  experimentId: 'experimentId',
  searchBarUuid: 'searchBarUuid',
};

jest.mock('components/plots/GeneReorderTool', () => () => 'MockedGeneReorderTool');
jest.mock('components/plots/GeneSearchBar', () => () => 'MockedGeneReorderSearchBar');

const markerGeneSelectionFactory = createTestComponentFactory(MarkerGeneSelection, defaultProps);

const mockStore = configureStore([]);
const store = mockStore({});

describe('MarkerGeneSelection', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('Should call onGenesChange with empty array when clicking "Clear All" button', async () => {
    const mockConfig = { ...initialPlotConfigStates[plotType], useMarkerGenes: false };

    await act(async () => {
      render(
        <Provider store={store}>
          {markerGeneSelectionFactory({ config: mockConfig })}
        </Provider>,
      );
    });

    const clearAllButton = screen.getByRole('button', { name: /clear all/i });

    await act(async () => {
      userEvent.click(clearAllButton);
    });

    expect(mockOnGenesChange).toHaveBeenCalledTimes(1);
    expect(mockOnGenesChange).toHaveBeenCalledWith([]);
  });

  it('Should show the number of marker genes input', async () => {
    const mockConfig = { ...initialPlotConfigStates[plotType], useMarkerGenes: true };

    await act(async () => {
      render(
        markerGeneSelectionFactory({ config: mockConfig }),
      );
    });

    expect(screen.getByText(/Number of marker genes per cluster/i)).toBeInTheDocument();

    // The run button should be disabled by default because the plot is showing the number of gnenes
    const runButton = screen.getByRole('button', { name: /run/i });
    expect(runButton.closest('button')).toBeDisabled();

    // Changing input enables the run button
    const nGenesInput = screen.getByRole('spinbutton', { name: 'Number of genes input' });
    userEvent.type(nGenesInput, '{backspace}2');

    expect(runButton.closest('button')).not.toBeDisabled();

    // Clicking run causes onUpdate to be called
    await act(async () => {
      userEvent.click(runButton);
    });

    expect(mockOnUpdate).toHaveBeenCalledTimes(1);
  });
});
