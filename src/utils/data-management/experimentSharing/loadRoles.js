import fetchAPI from 'utils/http/fetchAPI';

const loadRoles = async (experimentId) => fetchAPI(`/v2/access/${experimentId}`);

export default loadRoles;
