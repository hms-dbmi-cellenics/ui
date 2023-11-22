import React from 'react';
import { Provider } from 'react-redux';
import { mount, shallow } from 'enzyme';
import thunk from 'redux-thunk';
import {
  Result, Button, Progress, Typography,
} from 'antd';
import configureMockStore from 'redux-mock-store';
import fetchAPI from 'utils/http/fetchAPI';
import GEM2SLoadingScreen from 'components/GEM2SLoadingScreen';
import '__test__/test-utils/setupTests';

const { Title } = Typography;

const mockStore = configureMockStore([thunk]);

const store = mockStore({ experiments: {} });

jest.mock('utils/http/fetchAPI');
fetchAPI.mockImplementation(() => Promise.resolve(new Response(JSON.stringify({}))));

describe('GEM2SLoadingScreen', () => {
  it('Does not render without gem2s status', () => {
    expect(() => shallow(<GEM2SLoadingScreen />)).toThrow();
  });

  it('Renders toBeRun state correctly', () => {
    const component = mount(
      <Provider store={store}>
        <GEM2SLoadingScreen pipelineStatus='toBeRun' pipelineType='gem2s' />
      </Provider>,
    );

    const display = component.find(Result);

    expect(display.props().status).toEqual('toBeRun');
    expect(display.find(Button).length).toEqual(1);
    expect(display.find(Progress).length).toEqual(0);
  });

  it('Renders error state correctly', () => {
    const component = mount(
      <Provider store={store}>
        <GEM2SLoadingScreen pipelineStatus='error' pipelineType='gem2s' />
      </Provider>,
    );

    const display = component.find(Result);

    expect(display.props().status).toEqual('error');

    // Button 1 : Launch Another Experiment
    // Button 2 : Re-launch This Experiment
    expect(display.find(Button).length).toEqual(2);
    expect(display.find(Progress).length).toEqual(0);
  });

  it('Clicking re-launch analysis re-runs GEM2S', () => {
    const component = mount(
      <Provider store={store}>
        <GEM2SLoadingScreen experimentId='experimentId' pipelineStatus='error' pipelineType='gem2s' />
      </Provider>,
    );

    const relaunchButton = component.find(Button).at(1);
    relaunchButton.simulate('click');

    expect(fetchAPI).toHaveBeenCalled();
  });

  it('Renders running state correctly', () => {
    const completedSteps = [
      'step 1',
      'step 2',
    ];

    const steps = [
      'Downloading sample files',
      'Preprocessing samples',
      'Computing metrics',
    ];

    const component = mount(
      <Provider store={store}>
        <GEM2SLoadingScreen pipelineStatus='running' completedSteps={completedSteps} steps={steps} pipelineType='gem2s' />
      </Provider>,
    );

    const display = component.find(Result);

    expect(display.props().status).toEqual('running');
    expect(display.find(Button).length).toEqual(0);
    expect(display.find(Progress).length).toEqual(1);

    // Display step information as shown in steps
    expect(display.find('span.ant-typography').first().text()).toEqual(steps[completedSteps.length]);
  });

  it('Shows correct screen for subsetting experiment ', async () => {
    const completedSteps = [
      'step 1',
      'step 2',
    ];

    const steps = [
      'Downloading sample files',
      'Preprocessing samples',
      'Computing metrics',
    ];
    const experimentName = 'newExperiment';
    const component = mount(
      <Provider store={store}>
        <GEM2SLoadingScreen pipelineStatus='subsetting' completedSteps={completedSteps} steps={steps} experimentName={experimentName} pipelineType='gem2s' />
      </Provider>,
    );
    expect(component.find(Title).first().text()).toEqual(`Subsetting cell sets into${experimentName}`);
  });
});
