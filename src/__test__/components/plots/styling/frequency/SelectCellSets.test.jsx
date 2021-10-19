import React from 'react';
import '@testing-library/jest-dom';
import { Provider } from 'react-redux';
import thunk from 'redux-thunk';
import {
  screen, render, fireEvent,
} from '@testing-library/react';
import configureStore from 'redux-mock-store';
import SelectCellSets from 'components/plots/styling/frequency/SelectCellSets';
import { initialPlotConfigStates } from 'redux/reducers/componentConfig/initialState';
import { mockCellSets1 } from '__test__/test-utils/cellSets.mock';

const mockStore = configureStore([thunk]);

describe('Select cell sets tests ', () => {
  const config = initialPlotConfigStates.frequency;
  const store = mockStore({});
  const mockOnUpdate = jest.fn();

  const renderSelectCellSets = () => {
    const optionsMetadata = mockCellSets1.hierarchy.filter((set) => set.key === 'sample');
    const optionsCellSets = mockCellSets1.hierarchy.filter((set) => set.key !== 'sample');
    render(
      <Provider store={store}>
        <SelectCellSets
          onUpdate={mockOnUpdate}
          config={config}
          optionsMetadata={optionsMetadata}
          optionsCellSets={optionsCellSets}
        />
      </Provider>,
    );
  };

  it('renders properly', () => {
    renderSelectCellSets();
    expect(screen.getByText('Select the metadata that cells are grouped by', { exact: false })).toBeInTheDocument();
    expect(screen.getByText('Select the cell sets to be shown:')).toBeInTheDocument();
  });

  it('switching cellsets updates the plot', async () => {
    await renderSelectCellSets();
    const box = screen.getByLabelText('cell sets', { selector: 'input' });
    fireEvent.change(box, { target: { value: 'Scratchpad' } });
    const option = screen.getAllByText('Scratchpad')[1];
    fireEvent.click(option);
    const option2 = screen.getAllByText('Louvain')[1];
    fireEvent.click(option2);
    expect(mockOnUpdate).toHaveBeenCalledTimes(2);
  });
});
