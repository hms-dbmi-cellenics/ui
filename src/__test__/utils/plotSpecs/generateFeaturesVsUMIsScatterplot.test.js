import generateSpec from 'utils/plotSpecs/generateFeaturesVsUMIsScatterplot';
import mockData from '__test__/test-utils/mockData/mockGenesVsUMIsData.json';

const config = {
  spec: '1.0.0',
  dimensions: {
    width: 630,
    height: 500,
  },
  axes: {
    xAxisText: 'log10 [molecule counts]',
    yAxisText: 'log10 [gene counts]',
    titleFontSize: 13,
    labelFontSize: 12,
    offset: 0,
    gridOpacity: 10,
    gridWidth: 10,
    domainWidth: 2,
    xAxisRotateLabels: false,
  },
  axesRanges: {
    xAxisAuto: true,
    yAxisAuto: true,
    xMin: 0,
    xMax: 10,
    yMin: 0,
    yMax: 10,
  },
  title: {
    text: '',
    fontSize: 20,
    anchor: 'start',
    dx: 10,
  },
  fontStyle: {
    font: 'sans-serif',
    colour: '#000000',
  },
  colour: {
    masterColour: '#000000',
    gradient: 'default',
    toggleInvert: '#FFFFFF',
    invert: 'standard',
    reverseColourBar: false,
  },
  labels: {
    enabled: true,
    size: 18,
  },
  lower_cutoff: 4.8,
  upper_cutoff: 2.1,
};

describe('features vs umis plot', () => {
  it('picks correct linesData point if prediction interval is null', () => {
    const spec = generateSpec(config, mockData, { predictionInterval: null });
    expect(spec).toMatchSnapshot();
  });

  it('picks correct linesData point if prediction interval is between 0 and 0.99', () => {
    const spec = generateSpec(config, mockData, { predictionInterval: 0.84 });
    expect(spec).toMatchSnapshot();
  });

  it('picks correct linesData point if prediction interval is 0.999999', () => {
    const spec = generateSpec(config, mockData, { predictionInterval: 0.999999 });
    expect(spec).toMatchSnapshot();
  });
});
