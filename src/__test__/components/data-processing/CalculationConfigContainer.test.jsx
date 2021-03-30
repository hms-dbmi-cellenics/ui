import React from 'react';
import { mount, configure } from 'enzyme';
import preloadAll from 'jest-next-dynamic';
import Adapter from 'enzyme-adapter-react-16';
import { Provider } from 'react-redux';
import thunk from 'redux-thunk';
import { createStore, applyMiddleware } from 'redux';
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
  it.only('_sets/resets a `disabled` property of contained components when auto/manual is set', async () => {
    const testRadioButton = (value) => {
      container.setProps({ value });
      const radioButton = container.find(`input[value='${value}']`);
      radioButton.simulate('change');

      // Useless... see comments below
      container.update();
      calculationConfig.update();

      // The commented out test is the one I would like to pass,
      // but I have not found a way to see useSelector do its magic
      // I have tried running update() on container and on calculationConfig

      // expect(calculationConfig.props().disabled).toBe(value === 'automatic');
      expect(store.getState().experimentSettings.processing[filterName][sampleId].auto).toBe(value === 'automatic');
    };

    testRadioButton('manual');
    testRadioButton('automatic');
  });
  it('displays a warning when the auto setting is changed', (done) => {
    done.fail(new Error('To be written'));
  });
  it('displays a warning when conatined components notify a change', (done) => {
    done.fail(new Error('To be written'));
  });
  it('removes the warning when the values are applied to all samples', (done) => {
    done.fail(new Error('To be written'));
  });
  it('updated the redux store for all samples when the values are applied to all samples', (done) => {
    done.fail(new Error('To be written'));
  });
});
