/* eslint-disable react/jsx-props-no-spreading */
import { screen, render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';

import { act } from 'react-dom/test-utils';

import { initialPlotConfigStates } from 'redux/reducers/componentConfig/initialState';
import MarkerGeneSelection from 'components/plots/styling/MarkerGeneSelection';
import createTestComponentFactory from '__test__/test-utils/testComponentFactory';
import { plotTypes } from 'utils/constants';

const mockOnUpdate = jest.fn();
const mockOnReset = jest.fn();
const mockOnGeneEnter = jest.fn();

const defaultProps = {
  onUpdate: mockOnUpdate,
  onReset: mockOnReset,
  onGeneEnter: mockOnGeneEnter,
};

const plotType = plotTypes.DOT_PLOT;

const markerGeneSelectionFactory = createTestComponentFactory(MarkerGeneSelection, defaultProps);

describe('MarkerGeneSelection', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('Should show the custom gene input by default', async () => {
    const mockConfig = initialPlotConfigStates[plotType];

    await act(async () => {
      render(
        markerGeneSelectionFactory({ config: mockConfig }),
      );
    });

    // Expect screen to show the custom gene selection input by default
    expect(screen.getByText(/Type in a gene name/i)).toBeInTheDocument();

    // Typing genes and then pressing enter
    const geneInput = screen.getByRole('combobox');

    // This is not wrapped in act() because changes to the value causes a re-render
    // which causes mockOnGeneEnter to lose its  memory of having been called
    userEvent.type(geneInput, 'ABC{enter}');

    // Expect geneEnter to be called
    expect(mockOnGeneEnter).toHaveBeenCalledTimes(1);
    const inputValue = mockOnGeneEnter.mock.calls[0][0];

    expect(inputValue).toEqual(['ABC']);
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
