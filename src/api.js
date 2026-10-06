async function request(url, options) {
  const res = await fetch(url, options)
  if (!res.ok) {
    let message = `${res.status} ${res.statusText}`
    try {
      const body = await res.json()
      if (body?.error) message = body.error
    } catch {
      // non-JSON error body; keep the status text
      console.warn('Server returned a non-JSON body')
    }
    throw new Error(message)
  }
  return res.json()
}

export const listRepos = () => request('/api/repos')

export const addRepoFromUrl = (url) =>
  request('/api/repos', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url }),
  })

export const addRepoFromZip = (file) => {
  const form = new FormData()
  form.append('zip', file)
  return request('/api/repos/zip', { method: 'POST', body: form })
}

export const removeRepo = (id) => request(`/api/repos/${id}`, { method: 'DELETE' })

export const getAnalysis = (id) => request(`/api/repos/${id}/analysis`)
