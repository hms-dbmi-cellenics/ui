import generateLegendAlertHook from 'components/plots/helpers/generateLegendAlertHook';
import * as PlotLegendAlert from 'components/plots/helpers/PlotLegendAlert';

const hierarchy = [
  {
    key: 'louvain',
    children: [
      { key: 'louvain-1' },
      { key: 'louvain-2' },
      { key: 'louvain-3' },
    ],
  },
  {
    key: 'sample',
    children: [
      { key: 'KO' },
      { key: 'WT' },
    ],
  },
];

const config = {
  selectedCellSet: 'louvain',
};

describe('generateLegendAlertHook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    PlotLegendAlert.MAX_LEGEND_ITEMS = 1;
  });

  it('Should return a function', () => {
    const hookFn = generateLegendAlertHook(hierarchy, 'selectedCellSet');

    expect(typeof hookFn).toEqual('function');
  });

  it('Should use the plotConfig cellSet value for comparison', () => {
    const hookFn = generateLegendAlertHook(hierarchy, 'selectedCellSet');

    const modifiedConfig = hookFn(config);

    expect(JSON.stringify(config)).not.toEqual(JSON.stringify(modifiedConfig));
    expect(modifiedConfig).toMatchSnapshot();
  });

  it('Should be able to use the hardcoded value for comparison', () => {
    const hookFn = generateLegendAlertHook(hierarchy, 'sample', false);

    const modifiedConfig = hookFn(config);

    expect(JSON.stringify(config)).not.toEqual(JSON.stringify(modifiedConfig));
    expect(modifiedConfig).toMatchSnapshot();
  });

  it('Should return original config if number of cellSets is less than maximum to be shown', () => {
    PlotLegendAlert.MAX_LEGEND_ITEMS = 50;

    const hookFn = generateLegendAlertHook(hierarchy, 'selectedCellSet');

    const modifiedConfig = hookFn(config);

    expect(JSON.stringify(config)).toEqual(JSON.stringify(modifiedConfig));
  });
});
