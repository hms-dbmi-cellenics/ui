import { pathwayServices, serviceUrls } from './pathwayConstants';

const launchPathwayService = (serviceName, genesList, species) => {
  let url = null;
  let params = null;

  console.warn('*** species', species);
  console.warn('*** genesList', genesList);

  switch (serviceName) {
    case pathwayServices.PANTHERDB:
      url = serviceUrls[pathwayServices.PANTHERDB];
      console.log('*** url', url);

      params = {
        correction: 'fdr',
        format: 'html',
        resource: 'PANTHER',
        ontology: 'biological_process',
        input: genesList.gene_names.map((gene) => gene.toUpperCase()).join(','),
        species,
      };
      launchPantherDB(url, params);
      break;
    case pathwayServices.ENRICHR:
      url = serviceUrls[pathwayServices.ENRICHR][species];
      params = {
        genes_list: genesList.gene_names.join('\n'),
        description: `Cellenics ENRICHR run with ${genesList.gene_names.length} genes`,
      };
      launchEnrichr(url, params);
      break;
    default:
      throw new Error('No such external service');
  }
};

function launchEnrichr(url, params) {
  const genesInput = params.genes_list;
  const description = params.description || '';

  const form = document.createElement('form');

  form.method = 'POST';
  form.action = url;
  form.target = '_blank';
  form.style.display = 'none';

  const listField = document.createElement('input');
  const descField = document.createElement('input');

  listField.setAttribute('type', 'hidden');
  listField.setAttribute('name', 'list');
  listField.setAttribute('value', genesInput);
  form.appendChild(listField);

  descField.setAttribute('type', 'hidden');
  descField.setAttribute('name', 'description');
  descField.setAttribute('value', description);
  form.appendChild(descField);

  document.body.appendChild(form);
  form.submit();
  document.body.removeChild(form);
}

function launchPantherDB(url, params) {
  const form = document.createElement('form');
  form.target = '_blank';
  form.method = 'POST';
  form.action = url;
  form.style.display = 'none';

  console.warn('*** params', params);

  Object.keys(params).forEach((key) => {
    console.warn('*** params', params[key]);
    console.warn('*** key', key);

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
