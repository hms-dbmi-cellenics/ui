import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import preloadAll from 'jest-next-dynamic';
import { Provider } from 'react-redux';
import thunk from 'redux-thunk';
import { createStore, applyMiddleware } from 'redux';
import { Button } from 'antd';
import _ from 'lodash';
import rootReducer from '../../../redux/reducers/index';

import CalculationConfigContainer from '../../../components/data-processing/CalculationConfigContainer';
import generateExperimentSettingsMock from '../../test-utils/experimentSettings.mock';

jest.mock('localforage');

const koSampleId = 'sample-WT1';
const sampleIds = ['sample-WT', 'sample-WT1', 'sample-KO'];
const filterName = 'mitochondrialContent';

const initialExperimentState = generateExperimentSettingsMock(sampleIds);

const noData = {
  cellSets: {
    hierarchy: [
      {
        key: 'sample',
        children: sampleIds.map((sampleId) => ({ key: sampleId })),
      },
    ],
  },
  experimentSettings: {
    ...initialExperimentState,
  },
};

const ALERT_TEXT = 'copy these new settings to the rest of your samples';

const MockCalculationConfig = (props) => {
  // eslint-disable-next-line react/prop-types
  const { disabled, updateSettings } = props;
  return (
    <div>
      <h1>
        {`${disabled}`}
      </h1>
      <Button onClick={() => updateSettings({ method: 'test method' })}>Mock update</Button>
    </div>
  );
};
describe('CalculationConfigContainer', () => {
  let store = null;
  const onConfigChange = jest.fn();

  beforeAll(async () => {
    await preloadAll();
  });

  beforeEach(() => {
    jest.resetAllMocks();
    store = createStore(rootReducer, _.cloneDeep(noData), applyMiddleware(thunk));
    render(
      <Provider store={store}>
        <CalculationConfigContainer
          experimentId={expect.getState().currentTestName}
          sampleId={koSampleId}
          sampleIds={sampleIds}
          filterUuid={filterName}
          plotType='unused'
          onConfigChange={onConfigChange}
        >
          <MockCalculationConfig />
        </CalculationConfigContainer>
      </Provider>,
    );
  });
  const setRadioButton = (value) => {
    const label = value[0].toUpperCase() + value.slice(1);
    userEvent.click(screen.getByText(label));
  };
  it('sets/resets a `disabled` property of contained components when auto/manual is set', () => {
    const testRadioButton = (value) => {
      setRadioButton(value);
      expect(screen.getByRole('heading')).toHaveTextContent(`${value === 'automatic'}`);
      expect(store.getState().experimentSettings.processing[filterName][koSampleId].auto).toBe(value === 'automatic');
    };

    testRadioButton('automatic');
    testRadioButton('manual');
  });
  it('displays a warning when the auto setting is changed', () => {
    expect(screen.queryAllByText(ALERT_TEXT, { exact: false }).length).toBe(0);
    setRadioButton('manual');
    expect(screen.queryAllByText(ALERT_TEXT, { exact: false }).length).toBe(1);
  });
  it('displays a warning when contained components notifies a change', () => {
    expect(screen.queryAllByText(ALERT_TEXT, { exact: false }).length).toBe(0);
    userEvent.click(screen.getByText('Mock update'));
    expect(screen.queryAllByText(ALERT_TEXT, { exact: false }).length).toBe(1);
  });
  it('removes the warning when the values are applied to all samples', () => {
    userEvent.click(screen.getByText('Mock update'));
    expect(screen.queryAllByText(ALERT_TEXT, { exact: false }).length).toBe(1);
    userEvent.click(screen.getByText('Copy to all samples'));
    expect(screen.queryAllByText(ALERT_TEXT, { exact: false }).length).toBe(0);
  });
  it('updates the redux store for all samples when the values are applied to all samples', () => {
    let state = store.getState().experimentSettings.processing;
    setRadioButton('manual');
    userEvent.click(screen.getByText('Copy to all samples'));
    state = store.getState().experimentSettings.processing;
    expect(state[filterName][sampleIds[0]]).toEqual(state[filterName][sampleIds[1]]);
  });
});
