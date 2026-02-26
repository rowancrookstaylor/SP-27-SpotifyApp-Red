// services/spotifyApi.ts

const CLIENT_ID = '9757040e89904a92871a38381243d8e8';

export async function exchangeCodeForToken(
    code: string,
    redirectUri: string,
    codeVerifier: string
) {
    const response = await fetch(
        'https://accounts.spotify.com/api/token',
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                client_id: CLIENT_ID,
                grant_type: 'authorization_code',
                code,
                redirect_uri: redirectUri,
                code_verifier: codeVerifier,
            }).toString(),
        }
    );

    return response.json();
}

export async function getUserProfile(token: string) {
    const response = await fetch(
        'https://api.spotify.com/v1/me',
        {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        }
    );

    return response.json();
}