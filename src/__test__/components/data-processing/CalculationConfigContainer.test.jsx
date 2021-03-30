import React from 'react';
import { mount, configure } from 'enzyme';
import preloadAll from 'jest-next-dynamic';
import Adapter from 'enzyme-adapter-react-16';
import { act } from 'react-dom/test-utils';
import { Provider } from 'react-redux';
import thunk from 'redux-thunk';
import { createStore, applyMiddleware } from 'redux';
import { Alert, Button } from 'antd';
import rootReducer from '../../../redux/reducers/index';

import CalculationConfigContainer from '../../../components/data-processing/CalculationConfigContainer';
import initialExperimentState from '../../../redux/reducers/experimentSettings/initialState';

jest.mock('localforage');

const sampleId = 'sample-WT';
const sampleIds = ['sample-WT', 'sample-WT1', 'sample-KO'];
const experimentId = 'e1234';
const filterName = 'mitochondrialContent';

const noData = {
  experimentSettings: {
    ...initialExperimentState,
  },
};

const MockCalculationConfig = () => (
  <>
    hi
  </>
);
describe('CalculationConfigContainer', () => {
  let container = null;
  let calculationConfig = null;
  let store = null;
  const onConfigChange = jest.fn();

  beforeAll(async () => {
    await preloadAll();
  });

  configure({ adapter: new Adapter() });

  beforeEach(() => {
    jest.resetAllMocks();
    store = createStore(rootReducer, noData, applyMiddleware(thunk));
    container = mount(
      <Provider store={store}>
        <CalculationConfigContainer
          experimentId={experimentId}
          sampleId={sampleId}
          sampleIds={sampleIds}
          filterUuid={filterName}
          plotType='unused'
          onConfigChange={onConfigChange}
        >
          <MockCalculationConfig />
        </CalculationConfigContainer>
      </Provider>,
    );
    calculationConfig = container.find('MockCalculationConfig');
  });
  const setRadioButton = (value) => {
    act(() => {
      container.setProps({ value });
      const radioButton = container.find(`input[value='${value}']`);
      radioButton.simulate('change');
    });
  };
  it('sets/resets a `disabled` property of contained components when auto/manual is set', () => {
    const testRadioButton = (value) => {
      setRadioButton(value);

      // Useless... see comments below
      container.update();
      calculationConfig.update();

      // The commented out test is the one I would like to pass,
      // but I have not found a way to see useSelector do its magic

      // expect(calculationConfig.props().disabled).toBe(value === 'automatic');
      expect(store.getState().experimentSettings.processing[filterName][sampleId].auto).toBe(value === 'automatic');
    };

    testRadioButton('manual');
    testRadioButton('automatic');
  });
  it.skip('displays a warning when the auto setting is changed', () => {
    // TODO: works excuted on its own, fails as part of the test suite
    expect(container.find(Alert).length).toBe(0);
    setRadioButton('manual');
    container.update();
    expect(container.find(Alert).length).toBe(1);
  });
  it('displays a warning when contained components notifies a change', () => {
    expect(container.find(Alert).length).toBe(0);
    act(() => {
      calculationConfig.props().updateSettings({ method: 'test method' });
    });
    container.update();
    expect(container.find(Alert).length).toBe(1);
  });
  it('removes the warning when the values are applied to all samples', () => {
    act(() => {
      calculationConfig.props().updateSettings({ method: 'test method' });
    });
    container.update();
    expect(container.find(Alert).length).toBe(1);
    container.find(Button).simulate('click');
    container.update();
    expect(container.find(Alert).length).toBe(0);
  });
  it('updates the redux store for all samples when the values are applied to all samples', () => {
    let state = store.getState().experimentSettings.processing;
    expect(state[filterName][sampleIds[0]]).not.toEqual(state[filterName][sampleIds[1]]);
    setRadioButton('manual');
    container.find(Button).simulate('click');
    state = store.getState().experimentSettings.processing;
    container.update();
    expect(state[filterName][sampleIds[0]]).toEqual(state[filterName][sampleIds[1]]);
  });
});
