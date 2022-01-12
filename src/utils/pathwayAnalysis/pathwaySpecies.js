const H_SAPIENS = {
  value: 'sapiens',
  label: 'Homo sapiens',
};

const M_MUSCULUS = {
  value: 'musculus',
  label: 'Mus musculus',
};

const D_MELANOGASTER = {
  value: 'melanogaster',
  label: 'Drosophila melanogaster',
};

const S_CEREVISAE = {
  value: 'cerevisiae',
  label: 'Saccharomyces cerevisiae',
};
const C_ELEGANS = {
  value: 'elegans',
  label: 'Caenorhabditis elegans',
};

const D_RERIO = {
  value: 'rerio',
  label: 'Danio rerio',
};

const speciesMap = {
  H_SAPIENS, M_MUSCULUS, D_MELANOGASTER, S_CEREVISAE, C_ELEGANS, D_RERIO,
};

const speciesList = Object.values(speciesMap);

export default speciesList;
export {
  H_SAPIENS, M_MUSCULUS, D_MELANOGASTER, S_CEREVISAE, C_ELEGANS, D_RERIO,
};
