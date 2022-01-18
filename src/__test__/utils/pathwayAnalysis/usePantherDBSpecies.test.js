import usePantherDBSpecies from 'utils/pathwayAnalysis/usePantherDBSpecies';
import useSWR from 'swr';

jest.mock('swr');

const response = {
  search: {
    output: {
      genomes: {
        genome: [
          {
            name: 'human',
            taxon_id: 9606,
            short_name: 'HUMAN',
            version: 'Reference Proteome 2020_04',
            long_name: 'Homo sapiens',
          },
          {
            name: 'mouse',
            taxon_id: 10090,
            short_name: 'MOUSE',
            version: 'Reference Proteome 2020_04',
            long_name: 'Mus musculus',
          },
          {
            name: 'rat',
            taxon_id: 10116,
            short_name: 'RAT',
            version: 'Reference Proteome 2020_04',
            long_name: 'Rattus norvegicus',
          }],
      },
    },
  },
};

const result = [
  {
    label: 'Homo sapiens',
    value: 'HUMAN',
  },
  {
    label: 'Mus musculus',
    value: 'MOUSE',
  },
  {
    label: 'Rattus norvegicus',
    value: 'RAT',
  },
];

describe('usePantherDBSpecies', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('Returns an empty list if call fetch is still ongoing', () => {
    useSWR.mockImplementation(() => ({}));

    const { data } = usePantherDBSpecies();
    expect(data).toEqual([]);
  });

  it('Returns properly formatted', () => {
    useSWR.mockImplementation(() => ({
      data: response,
    }));

    const { data } = usePantherDBSpecies();
    expect(data).toEqual(result);
  });
});
