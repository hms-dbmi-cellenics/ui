import { pathwayServices, serviceUrls } from 'utils/pathwayAnalysis/pathwayConstants';

const launchPathwayService = (serviceName, genesList, species) => {
  let url = null;
  let params = null;

  const { total, data } = genesList;

  switch (serviceName) {
    case pathwayServices.PANTHERDB:
      url = serviceUrls[pathwayServices.PANTHERDB];
      params = {
        correction: 'fdr',
        format: 'html',
        resource: 'PANTHER',
        ontology: 'biological_process',
        input: data.gene_id.join('\n'),
        species,
      };
      postFormRequest(url, params);
      break;
    case pathwayServices.ENRICHR:
      url = serviceUrls[pathwayServices.ENRICHR][species];
      params = {
        list: data.gene_names.join('\n'),
        description: `Cellenics ENRICHR run with ${total} genes`,
      };
      postFormRequest(url, params, { enctype: 'multipart/form-data' });
      break;
    default:
      throw new Error('No such external service');
  }
};

function postFormRequest(url, params, formOptions = {}) {
  const form = document.createElement('form');
  form.action = url;

  const appliedFormOptions = {
    target: '_blank',
    method: 'POST',
    style: { display: 'none' },
    ...formOptions,
  };

  Object.keys(appliedFormOptions).forEach((key) => {
    form[key] = appliedFormOptions[key];
  });

  Object.keys(params).forEach((key) => {
    const input = document.createElement('input');
    input.type = 'hidden';
    input.name = key;
    input.value = params[key];
    form.appendChild(input);
  });

  document.body.appendChild(form);
  form.submit();
  document.body.removeChild(form);
}

export default launchPathwayService;
