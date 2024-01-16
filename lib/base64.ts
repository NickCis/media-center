function _btoa(data: any): string {
  return typeof window === 'undefined'
    ? Buffer.from(data).toString('base64')
    : btoa(unescape(encodeURIComponent(data)));
}

function _atob(str: string): string {
  return typeof window === 'undefined'
    ? Buffer.from(str, 'base64').toString()
    : atob(str);
}

export { _btoa as btoa, _atob as atob };
