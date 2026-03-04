// auth/spotifyAuth.ts

import * as AuthSession from 'expo-auth-session';

const CLIENT_ID = '9757040e89904a92871a38381243d8e8';

const discovery = {
    authorizationEndpoint: 'https://accounts.spotify.com/authorize',
    tokenEndpoint: 'https://accounts.spotify.com/api/token',
};

export function useSpotifyAuth() {
    const redirectUri = AuthSession.makeRedirectUri({
        scheme: 'spotifyapp', 
        
    });


    console.log('Redirect URI:', redirectUri);

    const [request, response, promptAsync] =
        AuthSession.useAuthRequest(
            {
                clientId: CLIENT_ID,
                scopes: [
                    'user-read-email',
                    'user-read-private',
                    'user-top-read',
                    'playlist-read-private',
                    'user-read-recently-played',
                    'user-read-playback-state',
                ],
                redirectUri, // pass it here
                responseType: AuthSession.ResponseType.Code,
                usePKCE: true,
            },
            discovery
        );

    console.log('Redirect URI:', redirectUri); // should now print spotifyapp://redirect

    return { request, response, promptAsync, redirectUri };
}