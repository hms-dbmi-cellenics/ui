/* eslint-disable react/jsx-props-no-spreading */
import React from 'react';
import { mount, configure } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';
import DotPlot from 'components/plots/DotPlot';
import { initialPlotConfigStates } from 'redux/reducers/componentConfig/initialState';

configure({ adapter: new Adapter() });

const dotPlotFactory = (props) => (
  <DotPlot {...props} />
);

const config = initialPlotConfigStates.dotPlot;

describe('DotPlot', () => {
  it('Renders a plot', () => {
    // Expects Vega to be called
    const component = mount(dotPlotFactory({ config }));

    const vega = component.find('Vega');

    expect(vega.length).toBe(1);
  });
});
