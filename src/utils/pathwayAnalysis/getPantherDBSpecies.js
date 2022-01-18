import pantherDBSpecies from 'utils/pathwayAnalysis/pantherDBSpecies.json';

const formatOuput = (data) => {
  const { genome } = data.search.output.genomes;

  const speciesList = genome.map((species) => ({
    label: species.long_name,
    value: species.short_name,
  }));

  return speciesList;
};

const getPantherDBSpecies = () => {
  const formattedData = formatOuput(pantherDBSpecies);
  return formattedData;
};

export default getPantherDBSpecies;
