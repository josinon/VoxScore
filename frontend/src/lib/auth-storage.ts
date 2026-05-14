const ACCESS_TOKEN_KEY = 'voxscore_access_token';

/**
 * O access token JWT fica em sessionStorage: sobrevive a refresh na mesma aba,
 * mas é limpo ao fechar o separador. **Não** é httpOnly: qualquer script na
 * origem pode lê-lo (risco XSS). Quando a API passar a usar cookie httpOnly,
 * remover esta camada e usar `credentials: 'include'`.
 */
export function getAccessToken(): string | null {
  try {
    return sessionStorage.getItem(ACCESS_TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setAccessToken(token: string | null): void {
  try {
    if (token == null || token === '') {
      sessionStorage.removeItem(ACCESS_TOKEN_KEY);
    } else {
      sessionStorage.setItem(ACCESS_TOKEN_KEY, token);
    }
  } catch {
    /* ignore quota / private mode */
  }
}
