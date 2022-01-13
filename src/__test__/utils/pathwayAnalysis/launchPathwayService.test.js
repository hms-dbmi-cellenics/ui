import launchPathwayService from 'utils/pathwayAnalysis/launchPathwayService';

import pathwayServices from 'utils/pathwayAnalysis/pathwayServices';

const genesList = {
  gene_names: ['gene1', 'gene2'],
};
const species = 'sapiens';

describe('LaunchPathwayService test', () => {
  it('Launches the enricher service', () => {
    // If it all goes well, it should return undefined
    expect(launchPathwayService(pathwayServices.ENRICHR, genesList, species)).toBe(undefined);
  });

  it('Throws an error if the given service name is invalid', () => {
    expect(() => {
      launchPathwayService('randomService', genesList, species);
    }).toThrow();
  });
});
