function extractFilename(contentDisposition) {
  if (!contentDisposition) return null
  // RFC 5987: filename*=UTF-8''encoded
  const starMatch = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i)
  if (starMatch) {
    return decodeURIComponent(starMatch[1])
  }
  // RFC 6266: filename="..."
  const quotedMatch = contentDisposition.match(/filename="([^"]+)"/i)
  if (quotedMatch) {
    return quotedMatch[1]
  }
  return null
}

export const downloadFile = (response, fallbackFilename = 'download') => {
  const blob = response.data
  const filename = extractFilename(response.headers['content-disposition']) || fallbackFilename
  const url = window.URL.createObjectURL(blob instanceof Blob ? blob : new Blob([blob]))
  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', filename)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  window.URL.revokeObjectURL(url)
}
