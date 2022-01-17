import { useState } from 'react';
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
  const [speciesList, setSpeciesList] = useState([]);

  useSWR(
    'http://pantherdb.org/services/oai/pantherdb/supportedgenomes',
    async (url) => {
      const response = await fetch(url);
      const data = await response.json();
      setSpeciesList(formatOuput(data));
    },
  );

  return speciesList;
};

export default usePantherDBSpecies;
