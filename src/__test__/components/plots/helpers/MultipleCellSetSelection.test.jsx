import React from 'react';
import { act } from 'react-dom/test-utils';
import MultipleCellSetSelection from 'components/plots/MultipleCellSetSelection';
import _ from 'lodash';
import { screen, render, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import fetchMock, { enableFetchMocks } from 'jest-fetch-mock';
import { makeStore } from 'redux/store';

import createTestComponentFactory from '__test__/test-utils/testComponentFactory';
import fake from '__test__/test-utils/constants';
import cellSetsWithScratchpad from '__test__/data/cell_sets_with_scratchpad.json';

import { selectOption } from '__test__/test-utils/rtlHelpers';

import mockAPI, {
  generateDefaultMockAPIResponses,
  promiseResponse,
} from '__test__/test-utils/mockAPI';
import { loadCellSets } from 'redux/actions/cellSets';

enableFetchMocks();

const experimentId = fake.EXPERIMENT_ID;

const defaultResponses = _.merge(
  generateDefaultMockAPIResponses(experimentId),
  {
    [`experiments/${fake.EXPERIMENT_ID}/cellSets`]: () => promiseResponse(
      JSON.stringify(cellSetsWithScratchpad),
    ),
  },
);

const mockOnChange = jest.fn();

const defaultProps = {
  onChange: mockOnChange,
};

const multipleCellSetSelectionFactory = createTestComponentFactory(
  MultipleCellSetSelection,
  defaultProps,
);

const renderMultipleCellSetSelection = async (store, props) => {
  await act(async () => (
    render(
      <Provider store={store}>
        {multipleCellSetSelectionFactory(props)}
      </Provider>,
    )
  ));
};

let storeState = null;

const openSelectDropdown = () => {
  userEvent.click(screen.queryAllByText('Select cell sets')[1]);
};

describe('MultipleCellSetSelection', () => {
  beforeEach(async () => {
    jest.clearAllMocks();

    fetchMock.resetMocks();
    fetchMock.doMock();
    fetchMock.mockIf(/.*/, mockAPI(defaultResponses));

    storeState = makeStore();
    storeState.dispatch(loadCellSets(fake.EXPERIMENT_ID));
  });

  it('Renders properly', async () => {
    await renderMultipleCellSetSelection(storeState);

    await waitFor(() => {
      expect(screen.queryAllByText('Select cell sets').length).toEqual(2);
    });
  });

  it('Shows the correct label when set', async () => {
    const labelText = 'Mock label text';

    const propsWithLabeltext = {
      labelText,
    };

    await renderMultipleCellSetSelection(storeState, propsWithLabeltext);

    expect(screen.getByText(labelText)).toBeInTheDocument();
  });

  it('Renders the correct extra elements', async () => {
    const extraElements = (
      <div>
        Extra elements
      </div>
    );

    const propsWithExtraElement = {
      extraElements,
    };

    await renderMultipleCellSetSelection(storeState, propsWithExtraElement);

    expect(screen.getByText('Extra elements')).toBeInTheDocument();
  });

  it('Displays and get root nodes correctly', async () => {
    const rootNodeNames = cellSetsWithScratchpad.cellSets.map(({ name }) => name);

    await renderMultipleCellSetSelection(storeState);
    openSelectDropdown();

    rootNodeNames.forEach((name) => {
      expect(screen.getByText(`All ${name}`)).toBeInTheDocument();
    });
  });

  it('Displays child nodes correctly', async () => {
    const childNodeNames = cellSetsWithScratchpad.cellSets.map(
      ({ children }) => children.map(({ name }) => name),
    ).flat();

    await renderMultipleCellSetSelection(storeState);
    openSelectDropdown();

    // There is a limitation to the number of element shown in an antd list.In this test's case,
    // the last child element is hidden shown. To partially assert that the other child nodes are
    //  displayed, the array is modified to only asser the names that are shown
    childNodeNames.pop();

    childNodeNames.forEach((name) => {
      expect(screen.getByText(name)).toBeInTheDocument();
    });
  });

  it('Returns the correct values', async () => {
    await renderMultipleCellSetSelection(storeState);

    // key of the cell set as seen in
    const testSampleName = 'KO';
    const testSampleKey = 'b62028a1-ffa0-4f10-823d-93c9ddb88898';

    const selection = screen.getAllByRole('combobox')[0];

    // Select a sample
    await selectOption(testSampleName, selection);

    expect(mockOnChange.mock.calls[0][0]).toEqual([testSampleKey]);
  });
});
