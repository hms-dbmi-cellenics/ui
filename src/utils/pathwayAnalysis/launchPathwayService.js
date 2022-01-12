import pathwayServices, { serviceUrls } from './pathwayServices';

const launchPathwayService = (serviceName, genesList, species) => {
  let url = null;
  let params = null;

  switch (serviceName) {
    case pathwayServices.ENRICHR:
      url = serviceUrls[pathwayServices.ENRICHR][species];
      params = {
        description: `Cellenics ENRICHR run with ${genesList.length} genes`,
        popup: true,
      };
      launchEnrichr(url, genesList.gene_names, params);
      break;
    default:
      throw new Error('No such external service');
  }
};

function launchEnrichr(target, genesList, options) {
  const genesInput = genesList.join('\n');

  const description = options.description || '';
  const popup = options.popup || false;
  const form = document.createElement('form');
  const listField = document.createElement('input');
  const descField = document.createElement('input');

  form.setAttribute('method', 'post');
  form.setAttribute('action', target);
  if (popup) {
    form.setAttribute('target', '_blank');
  }
  form.setAttribute('enctype', 'multipart/form-data');

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

export default launchPathwayService;
