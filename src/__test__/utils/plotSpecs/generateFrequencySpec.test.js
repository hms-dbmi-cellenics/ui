import { generateData } from 'utils/plotSpecs/generateFrequencySpec';
import { mockCellSets } from '__test__/test-utils/cellSets.mock';
import { initialPlotConfigStates } from 'redux/reducers/componentConfig/initialState';

describe('Generate frequency plot data', () => {
  const { hierarchy, properties } = mockCellSets;
  const config = initialPlotConfigStates.frequency;

  it('Generates proportional data', () => {
    const data = generateData(hierarchy, properties, config);

    expect(data).toMatchSnapshot();
  });

  it('Generates count data', () => {
    config.frequencyType = 'count';
    const data = generateData(hierarchy, properties, config);

    expect(data).toMatchSnapshot();
  });
});
