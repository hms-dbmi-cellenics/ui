import launchPathwayService from 'utils/pathwayAnalysis/launchPathwayService';

import { pathwayServices } from 'utils/pathwayAnalysis/pathwayConstants';

const genesList = {
  total: 2,
  data: {
    gene_names: ['gene1', 'gene2'],
    gene_id: ['ENMUSG00000001', 'ENMUSG00000002'],
  },
};
const enrichrSpecies = 'sapiens';
const pantherDBSpecies = 'HUMAN';

describe('LaunchPathwayService test', () => {
  beforeAll(() => {
    // This is required because JSDOM doesn't implement form.submit()
    // https://github.com/jsdom/jsdom/issues/1937#issuecomment-461810980
    window.HTMLFormElement.prototype.submit = () => {};
  });

  it('Launches the pantherDB service', () => {
    // If the launch goes well, it should return undefined
    expect(() => {
      launchPathwayService(pathwayServices.ENRICHR, genesList, enrichrSpecies);
    }).not.toThrow();
  });

  it('Launches the enricher service', () => {
    // If the lalunch goes well, it should return undefined
    expect(() => {
      launchPathwayService(pathwayServices.PANTHERDB, genesList, pantherDBSpecies);
    }).not.toThrow();
  });

  it('Throws an error if the given service name is invalid', () => {
    expect(() => {
      launchPathwayService('randomService', genesList, enrichrSpecies);
    }).toThrow();
  });
});
