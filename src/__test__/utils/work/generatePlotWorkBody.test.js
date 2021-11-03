import plotNames from 'utils/plots/plotNames';
import generatePlotWorkBody from 'utils/work/generatePlotWorkBody';

import { initialPlotConfigStates } from 'redux/reducers/componentConfig/initialState';

describe('Generate plot work request body', () => {
  it('Generates the correct work request body for DotPlot', () => {
    const workBody = generatePlotWorkBody(plotNames.DOT_PLOT, initialPlotConfigStates.dotPlot);

    expect(workBody.name).toEqual(plotNames.DOT_PLOT);
    expect(workBody).toMatchSnapshot();
  });
});
