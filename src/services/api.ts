import { toPairs } from "lodash";
import "whatwg-fetch";

const SPOTIFY_ROOT = "https://api.spotify.com/v1";
const AUTH_ENDPOINT =
  "https://nuod0t2zoe.execute-api.us-east-2.amazonaws.com/FT-Classroom/spotify-auth-token";
const TOKEN_KEY =
  "BQA3OmOsdzv0a0N3gKlw7UFUlb1-t5axnDWwcGE-Zh5TxFT9sZPX9ZhlLx0ZfSENUSzP4h3sop4MY0bCh0G8Ltoaf86TjsfV80MwMoQBg3Zpe1MmCn8";

type Artist = {
  name: string;
  // Add other properties if needed
};

type Album = {
  album_type: string;
  artists: Artist[];
  available_markets: string[];
  external_urls: {
    spotify: string;
    // Add other properties if needed
  };
  href: string;
  id: string;
  images: {
    // Image properties
    // ...
  }[];
  name: string;
  release_date: string;
  release_date_precision: string;
  total_tracks: number;
  type: string;
  uri: string;
  // Add other properties if needed
};

type Track = {
  name: string;
  artists: Artist[];
  uri: string;
  id: string;
  // Add other properties if needed
};

/**
 * Parses the JSON returned by a network request
 *
 * @param  {object} response A response from a network request
 *
 * @return {object}          The parsed JSON from the request
 */
const parseJSON = (response: any) => {
  if (response.status === 204 || response.status === 205) {
    return null;
  }
  return response.json();
};

/**
 * Checks if a network request came back fine, and throws an error if not
 *
 * @param  {object} response   A response from a network request
 *
 * @return {object|undefined} Returns either the response, or throws an error
 */

const checkStatus = (response: any) => {
  if (response.status >= 200 && response.status < 300) {
    return response;
  }
  const error: any = new Error(response.statusText);
  error.response = response;
  throw error;
};

/**
 * Requests a URL, returning a promise
 *
 * @param  {string} url       The URL we want to request
 * @param  {object} [options] The options we want to pass to "fetch"
 *
 * @return {object}           The response data
 */
export const request = (url: any, options?: any) => {
  // Check if options include params and convert them to query parameters
  if (options && options.params) {
    const paramString = new URLSearchParams(options.params).toString();
    url += `?${paramString}`;
    // Remove params from options to prevent duplicate inclusion
    delete options.params;
  }

  // eslint-disable-next-line no-undef
  return fetch(url, options).then(checkStatus).then(parseJSON);
};

const fetchFromSpotify = ({ token, endpoint, params }: any) => {
  let url = [SPOTIFY_ROOT, endpoint].join("/");
  if (params) {
    const paramString = toPairs(params)
      .map((param: any) => param.join("="))
      .join("&");
    url += `?${paramString}`;
  }
  const options = { headers: { Authorization: `Bearer ${token}` } };
  console.log("Spotify API Request URL:", url);
  console.log("Spotify API Request Options:", options);

  // Log the response from the Spotify API
  return request(url, options)
    .then((response) => {
      //console.log('Spotify API Response:', response);
      return response;
    })
    .catch((error) => {
      console.error("Spotify API Error:", error);
      throw error;
    });
};

const authenticateWithSpotify = async () => {
  try {
    // Specify the desired scopes
    const scopes = ["user-read-playback-state", "user-modify-playback-state"];

    // Construct the authentication URL with the specified scopes
    const authUrl = `${AUTH_ENDPOINT}?scopes=${encodeURIComponent(
      scopes.join(" ")
    )}`;

    // Open the Spotify authentication URL in a new window or redirect the user to it
    // For example, you can use window.open(authUrl) to open it in a new window

    // After the user grants permission, obtain the access token as before
    const response = await fetch(authUrl);
    const data = await response.json();
    const accessToken = data.access_token;

    // Set the expiration time (adjust as needed)
    const expirationTime = Math.floor(Date.now() / 1000) + data.expires_in;
    localStorage.setItem("tokenExpiration", expirationTime.toString());

    console.log("Spotify API Authentication Response:", data);

    if (accessToken) {
      localStorage.setItem(TOKEN_KEY, accessToken);
      return accessToken;
    } else {
      throw new Error("Failed to retrieve access token");
    }
  } catch (error) {
    console.error("Error during Spotify authentication:", error);
    return null;
  }
};

const fetchTopTracksOfArtist = async (artistId: string) => {
  let token = localStorage.getItem(TOKEN_KEY);
  if (!token) {
    token = await authenticateWithSpotify();
  }
  if (token) {
    const endpoint = `artists/${artistId}/top-tracks`;
    const params = { market: "US" };
    return fetchFromSpotify({ token, endpoint, params });
  }
};

const getSpotifyToken = async (): Promise<string | null> => {
  let token = localStorage.getItem(TOKEN_KEY);
  token = await authenticateWithSpotify();

  if (!token) {
    // Token not present or not valid, authenticate and get a new token
    token = await authenticateWithSpotify();
  }

  console.log("Access Token:", token);

  return token;
};

const getRandomTrack = async (): Promise<Track | null> => {
  try {
    const token = await getSpotifyToken();
    const endpointFeaturedPlaylists = "browse/featured-playlists";
    const featuredPlaylistsResponse = await fetchFromSpotify({
      token,
      endpoint: endpointFeaturedPlaylists,
    });
    const playlists = featuredPlaylistsResponse?.playlists?.items;

    if (playlists && playlists.length > 0) {
      const randomPlaylist =
        playlists[Math.floor(Math.random() * playlists.length)];
      const playlistId = randomPlaylist.id;

      const endpointTracks = `playlists/${playlistId}/tracks`;
      const tracksResponse = await fetchFromSpotify({
        token,
        endpoint: endpointTracks,
      });

      if (tracksResponse?.items?.length > 0) {
        // Extract track information from the first track in the response
        const firstTrack = tracksResponse.items[0].track;
        const randomTrack: Track = {
          id: firstTrack.id,
          name: firstTrack.name,
          artists: firstTrack.artists,
          uri: firstTrack.uri,
          // Add other properties if needed
        };

        console.log("Random Track:", randomTrack);

        return randomTrack;
      } else {
        console.error('No items found in the "items" array of Tracks Response');
      }
    } else {
      console.error("No featured playlists found in the response");
    }

    console.error("No tracks found in the response");
    return null;
  } catch (error) {
    console.error("Error fetching random track:", error);
    return null;
  }
};

const getWrongAnswers = async (
  correctTrack: any
): Promise<{ correct: any; wrong: any[] } | null> => {
  try {
    const token = await getSpotifyToken();

    const wrongAlbumsEndpoint = "browse/featured-playlists";
    const wrongAlbumsResponse = await fetchFromSpotify({
      token,
      endpoint: wrongAlbumsEndpoint,
    });
    const wrongPlaylists = wrongAlbumsResponse?.playlists?.items;

    if (wrongPlaylists && wrongPlaylists.length > 0) {
      const randomWrongPlaylist =
        wrongPlaylists[Math.floor(Math.random() * wrongPlaylists.length)];
      const wrongPlaylistId = randomWrongPlaylist.id;

      const wrongTracksEndpoint = `playlists/${wrongPlaylistId}/tracks`;
      const wrongTracksResponse = await fetchFromSpotify({
        token,
        endpoint: wrongTracksEndpoint,
      });

      if (wrongTracksResponse?.items?.length > 0) {
        // Extract track information from the first track in the response
        const firstWrongTrack = wrongTracksResponse.items[0].track;
        const randomWrongTrack: Track = {
          id: firstWrongTrack.id,
          name: firstWrongTrack.name,
          artists: firstWrongTrack.artists,
          uri: firstWrongTrack.uri,
          // Add other properties if needed
        };

        console.log("Random Wrong Track:", randomWrongTrack);

        return { correct: correctTrack, wrong: [randomWrongTrack] } as {
          correct: any;
          wrong: any[];
        };
      } else {
        console.error(
          'No items found in the "items" array of Wrong Tracks Response'
        );
      }
    } else {
      console.error("No wrong playlists found in the response");
    }

    console.error("No wrong tracks found in the response");
    return null;
  } catch (error) {
    console.error("Error fetching wrong answers:", error);
    return null;
  }
};

export {
  fetchFromSpotify,
  fetchTopTracksOfArtist,
  getSpotifyToken,
  getRandomTrack,
  getWrongAnswers,
  Track,
};
