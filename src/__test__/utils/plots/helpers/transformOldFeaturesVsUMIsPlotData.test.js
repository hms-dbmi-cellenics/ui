import _ from 'lodash';
import transformOldFeaturesVsUMIsPlotData from '../../../../components/plots/helpers/transformOldFeaturesVsUMIsPlotData';

const oldPlotData = [
  {
    log_molecules: 5, log_genes: 5, upper_cutoff: 5.5, lower_cutoff: 4.5,
  },
  {
    log_molecules: 10, log_genes: 10, upper_cutoff: 10.5, lower_cutoff: 9.5,
  },
];

const newPlotData = {
  pointsData: [
    { log_molecules: 5, log_genes: 5 },
    { log_molecules: 10, log_genes: 10 },
  ],
  linesData: [
    { lower_cutoff: 4.5, upper_cutoff: 5.5, log_molecules: 5 },
    { lower_cutoff: 9.5, upper_cutoff: 10.5, log_molecules: 10 },
  ],
};

describe('transformOldFeaturesVsUMIsPlotData', () => {
  it('transforms data correctly', () => {
    const result = transformOldFeaturesVsUMIsPlotData(oldPlotData);
    expect(_.isEqual(newPlotData, result)).toEqual(true);
  });
});
