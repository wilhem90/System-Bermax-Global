
export default async function requestApi(url, method = 'GET', data = {}) {
  const baseUrl = 'http://localhost:8080/api/' + url;
  console.log("Chegando por ai!")

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

    return result;
  } catch (error) {
    return { success: false, error: error.message };
  }
}
