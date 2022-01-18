import useSWR from 'swr';

const formatOuput = (data) => {
  const { genome } = data.search.output.genomes;

  const speciesList = genome.map((species) => ({
    label: species.long_name,
    value: species.short_name,
  }));

  return speciesList;
};

const usePantherDBSpecies = () => {
  const { data, error } = useSWR(
    'http://pantherdb.org/services/oai/pantherdb/supportedgenomes',
    async (url) => {
      const response = await fetch(url);
      const responseData = await response.json();
      return responseData;
    },
  );

  const formattedData = data ? formatOuput(data) : [];
  return {
    data: formattedData,
    error,
  };
};

export default usePantherDBSpecies;
