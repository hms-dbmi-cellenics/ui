import { plotTypes } from 'utils/constants';
import generatePlotWorkBody from 'utils/work/generatePlotWorkBody';

import { initialPlotConfigStates } from 'redux/reducers/componentConfig/initialState';

describe('Generate plot work request body', () => {
  it('Generates the correct work request body for DotPlot', () => {
    const workBody = generatePlotWorkBody(
      plotTypes.DOT_PLOT,
      initialPlotConfigStates[plotTypes.DOT_PLOT],
    );

    expect(workBody.name).toEqual(plotTypes.DOT_PLOT);
    expect(workBody).toMatchSnapshot();
  });

  it('Throws an error if the wrong plot type is passed in', () => {
    const nonExistentPlotName = 'NONEXISTENT_PLOT_NAME';

    expect(
      () => {
        generatePlotWorkBody(
          nonExistentPlotName,
          {},
        );
      },
    ).toThrow();
  });
});
