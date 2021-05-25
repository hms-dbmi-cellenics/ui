import React from 'react';
import { mount, shallow, configure } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';
import preloadAll from 'jest-next-dynamic';
import {
  Result, Button, Progress,
} from 'antd';
import GEM2SLoadingScreen from '../../components/GEM2SLoadingScreen';

configure({ adapter: new Adapter() });

describe('GEM2SLoadingScreen', () => {
  beforeAll(async () => {
    await preloadAll();
  });

  it('Does not render without gem2s status', () => {
    expect(() => shallow(<GEM2SLoadingScreen />)).toThrow();
  });

  it('Renders toBeRun state correctly', () => {
    const component = mount(
      <GEM2SLoadingScreen gem2sStatus='toBeRun' />,
    );

    const display = component.find(Result);

    expect(display.props().status).toEqual('info');
    expect(display.find(Button).length).toEqual(1);
    expect(display.find(Progress).length).toEqual(0);
  });

  it('Renders error state correctly', () => {
    const component = mount(
      <GEM2SLoadingScreen gem2sStatus='error' />,
    );

    const display = component.find(Result);

    expect(display.props().status).toEqual('error');
    expect(display.find(Button).length).toEqual(1);
    expect(display.find(Progress).length).toEqual(0);
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
      <GEM2SLoadingScreen gem2sStatus='running' completedSteps={completedSteps} steps={steps} />,
    );

    const display = component.find(Result);

    expect(display.props().status).toEqual('running');
    expect(display.find(Button).length).toEqual(0);
    expect(display.find(Progress).length).toEqual(1);

    // Display step information as shown in steps
    expect(display.find('span.ant-typography').first().text()).toEqual(steps[completedSteps.length]);
  });
});
