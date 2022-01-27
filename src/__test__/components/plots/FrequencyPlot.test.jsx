import React from 'react';
import { render } from '@testing-library/react';
import FrequencyPlot from 'components/plots/FrequencyPlot';
import { Provider } from 'react-redux';
import fake from '__test__/test-utils/constants';
import fetchMock, { enableFetchMocks } from 'jest-fetch-mock';
import { makeStore } from 'redux/store';
import { initialPlotConfigStates } from 'redux/reducers/componentConfig/initialState';

import mockAPI, {
  generateDefaultMockAPIResponses,
} from '__test__/test-utils/mockAPI';

describe('Frequency plot tests', () => {
  const updateCSV = jest.fn();
  let storeState = null;

  const renderFrequencyPlot = () => {
    render(
      <Provider store={storeState}>
        <FrequencyPlot
          formatCSVData={updateCSV}
          config={initialPlotConfigStates.frequency}
          experimentId={fake.EXPERIMENT_ID}
        />
      </Provider>,
    );
  };
  beforeEach(() => {
    enableFetchMocks();
    fetchMock.resetMocks();
    storeState = makeStore();

    fetchMock.doMock();
    fetchMock.mockIf(/.*/, mockAPI(generateDefaultMockAPIResponses(fake.EXPERIMENT_ID)));
  });

  it('Updates CSV data on render', () => {
    renderFrequencyPlot();
    expect(updateCSV).toHaveBeenCalled();
  });
});
