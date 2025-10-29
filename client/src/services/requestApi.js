export default async function requestApi(url, method = 'GET', data = {}) {
  // const baseUrl = 'https://server-98434363848.us-central1.run.app/api/' + url;
  const baseUrl = 'http://localhost:8080/api/' + url;
  const options = {
    method,
    headers: {
      deviceid: data.deviceid,
      Authorization: `Bearer ${data.token}`,
    },
  };
  
  // Adiciona o body apenas se for método que envia dados
  if (['POST', 'PUT', 'PATCH'].includes(method.toUpperCase())) {
    options.headers['Content-Type'] = 'application/json';
    options.body = JSON.stringify(data);
  }
  
  try {
    const response = await fetch(baseUrl, options);

    // Converte a resposta para JSON, tratando erros
    const result = await response.json();
    if (result.message === 'Credentials incorrect!') {
      localStorage.removeItem('userData');
    }

    return result;
  } catch (error) {
    console.log(error);
    return { success: false, error: error.message };
  }
}
