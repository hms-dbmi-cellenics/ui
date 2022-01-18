import getPantherDBSpecies from 'utils/pathwayAnalysis/getPantherDBSpecies';

describe('getPantherDBSpecies', () => {
  it('Returns properly formatted', () => {
    const data = getPantherDBSpecies();
    expect(data).toMatchSnapshot();
  });
});
