import {
  H_SAPIENS, M_MUSCULUS, D_MELANOGASTER, S_CEREVISAE, C_ELEGANS, D_RERIO,
} from 'utils/pathwayAnalysis/enrichrConstants';

const pathwayServices = { PANTHERDB: 'pantherdb', ENRICHR: 'enrichr' };

const serviceUrls = {
  [pathwayServices.PANTHERDB]: 'https://pantherdb.org/webservices/go/overrep.jsp',
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
};
