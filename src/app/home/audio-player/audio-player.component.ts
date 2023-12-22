import {
  Component,
  OnInit,
  ViewChild,
  ElementRef,
  Output,
  EventEmitter,
} from "@angular/core";
import { GameConfigService } from "src/services/game-config.service";
import { getSpotifyToken, request } from "src/services/api";

interface SpotifyTrack {
  album: {
    // album properties
  };
  artists: {
    // artists properties
  }[];
  disc_number: number;
  duration_ms: number;
  explicit: boolean;
  external_ids: {
    isrc: string;
  };
  external_urls: {
    spotify: string;
  };
  href: string;
  id: string;
  is_local: boolean;
  is_playable: boolean;
  name: string;
  popularity: number;
  preview_url: string | null;
  track_number: number;
  type: string;
  uri: string;
}

@Component({
  selector: "app-audio-player",
  templateUrl: "./audio-player.component.html",
  styleUrls: ["./audio-player.component.css"],
})
export class AudioPlayerComponent implements OnInit {
  @ViewChild("audioPlayer") audioPlayer!: ElementRef<HTMLAudioElement>;
  @Output() audioLoaded = new EventEmitter<void>();
  audioSrc: string = "";
  playDuration: number = 30000;
  artistId: string = "";
  artistName: string = "";

  constructor(private gameConfigService: GameConfigService) {}

  ngOnInit() {
    console.log("AudioPlayerComponent initialized");
    if (this.artistId) {
      this.setupGame();
    } else {
      // console.error("Artist ID is null or undefined.");
      // Handle the case where artistId is undefined, if necessary
    }
  }

  async setupGame(artistId?: string, artistName?: string, token?: string) {
    this.artistId = artistId || this.artistId;
    this.artistName = artistName || this.artistName;

    const config = this.gameConfigService.getConfig();

    // Check if artistId is available, otherwise log an error
    if (artistId) {
      config.artist = artistId;

      console.log("Artist ID from config:", config.artist);
      this.playDuration = this.getDurationFromDifficulty(config.difficulty);

      // Use artist information to fetch and play the song
      await this.fetchAndPlaySong(this.artistId);
    } else {
      console.error("Artist ID is undefined.");
      // Handle the case where artistId is undefined, if necessary
    }
  }

  getAudioSource(): string {
    // Check if artistId is defined before constructing the URL
    if (this.artistId) {
      // Construct the audio source URL based on artist information
      return `https://api.spotify.com/v1/artists/${this.artistId}/top-tracks?market=US`;
    } else {
      console.error(
        "Artist ID is undefined. Unable to construct audio source URL."
      );
      return ""; // Return an empty string or handle the case where artistId is undefined
    }
  }

  async fetchAndPlaySong(artistId: string) {
    try {
      const token = await getSpotifyToken();
      if (!token) {
        throw new Error("Failed to retrieve Spotify access token");
      }

      const url = `https://api.spotify.com/v1/artists/${artistId}/top-tracks?market=US`;
      console.log("Request URL (audio-player):", url);
      const tracksResponse = await request(
        `https://api.spotify.com/v1/artists/${artistId}/top-tracks`,
        {
          headers: { Authorization: `Bearer ${token}` },
          params: { market: "US" },
        }
      );

      console.log("API Response:", tracksResponse); // Log the entire response

      if (
        tracksResponse &&
        tracksResponse.tracks &&
        tracksResponse.tracks.length > 0
      ) {
        const playableTracks: SpotifyTrack[] = tracksResponse.tracks.filter(
          (track: SpotifyTrack) => track.is_playable
        );

        if (playableTracks.length > 0) {
          // Pick the first playable track
          const previewUrl = playableTracks[0].preview_url;

          if (previewUrl) {
            this.audioSrc = previewUrl;
            console.log("Audio Source URL:", this.audioSrc); // Log the audio source URL
            this.playSong();
          } else {
            console.warn("No playable track found with a non-null preview URL");
            // Handle the case where all playable tracks have null preview_url
          }
        } else {
          console.warn("No playable tracks found");
          // Handle the case where no playable tracks are available
        }
      } else {
        console.error("No tracks found for the artist");
      }
    } catch (error) {
      console.error("Error fetching tracks:", error);
    }
  }

  getDurationFromDifficulty(difficulty: string): number {
    switch (difficulty) {
      case "easy":
        return 30000;
      case "medium":
        return 20000;
      case "hard":
        return 10000;
      default:
        return 30000;
    }
  }

  playSong() {
    const audio = this.audioPlayer.nativeElement;
    audio.load();
    audio.play();
    audio.onloadeddata = () => {
      this.audioLoaded.emit();
    };

    setTimeout(() => audio.pause(), this.playDuration);
  }

  stopPlayback() {
    const audio = this.audioPlayer.nativeElement;
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }
  }
}
