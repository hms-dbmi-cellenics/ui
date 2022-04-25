import fetchAPI from 'utils/http/fetchAPI';

const loadRoles = async (experimentId) => fetchAPI(`/v1/access/${experimentId}`);

export default loadRoles;
