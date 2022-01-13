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

const pathwayServices = { PANTHERDB: 'pantherdb', ENRICHR: 'enrichr' };

const serviceUrls = {
  [pathwayServices.ENRICHR]: {
    [H_SAPIENS.value]: 'https://maayanlab.cloud/Enrichr/enrich',
    [M_MUSCULUS.value]: 'https://maayanlab.cloud/Enrichr/enrich',
    [D_MELANOGASTER.value]: 'https://maayanlab.cloud/FlyEnrichr/enrich',
    [S_CEREVISAE.value]: 'https://maayanlab.cloud/YeastEnrichr/enrich',
    [C_ELEGANS.value]: 'https://maayanlab.cloud/WormEnrichr/enrich',
    [D_RERIO.value]: 'https://maayanlab.cloud/FishEnrichr/enrich',
  },
};

export {
  pathwayServices,
  serviceUrls,
  speciesList,
};
