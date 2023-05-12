import fetchAPI from 'utils/http/fetchAPI';

const isUserAuthorized = async (experimentId, url, method) => {
  const queryParams = new URLSearchParams({ url, method });
  return await fetchAPI(`/v2/access/${experimentId}/check?${queryParams}`, { method: 'GET' });
};

export default isUserAuthorized;
