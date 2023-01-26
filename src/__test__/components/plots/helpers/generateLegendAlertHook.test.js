import generateLegendAlertHook, { MAX_LEGEND_ITEMS } from 'components/plots/helpers/generateLegendAlertHook';

const hierarchy = [
  {
    key: 'louvain',
    children: [...Array(100)].map((_, i) => `louvain-${i}`),
  },
  {
    key: 'sample',
    children: [...Array(100)].map((_, i) => `sample-${i}`),
  },
];

const config = {
  selectedCellSet: 'louvain',
};

describe('generateLegendAlertHook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
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
    const smallHierarchy = [{
      key: 'louvain',
      children: [...Array(10)].map((_, i) => `louvain-${i}`),
    }];

    const hookFn = generateLegendAlertHook(smallHierarchy, 'selectedCellSet');

    const modifiedConfig = hookFn(config);

    expect(JSON.stringify(config)).toEqual(JSON.stringify(modifiedConfig));
  });

  it('Exports the number of max legend items', () => {
    expect(MAX_LEGEND_ITEMS).toMatchInlineSnapshot('50');
  });
});
