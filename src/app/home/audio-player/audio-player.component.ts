import { Component, OnInit, ViewChild, ElementRef } from "@angular/core";
import { GameConfigService } from "src/services/game-config.service";
import { getSpotifyToken, request } from "src/services/api";

@Component({
  selector: "app-audio-player",
  templateUrl: "./audio-player.component.html",
  styleUrls: ["./audio-player.component.css"],
})
export class AudioPlayerComponent implements OnInit {
  @ViewChild("audioPlayer") audioPlayer!: ElementRef<HTMLAudioElement>;
  audioSrc: string = "";
  playDuration: number = 30000;
  artistId: string = "";
  artistName: string = "";

  constructor(private gameConfigService: GameConfigService) {}

  ngOnInit() {
    console.log('AudioPlayerComponent initialized');
    this.setupGame();
  }

  async setupGame(artistId?: string, artistName?: string) {
    this.artistId = artistId || this.artistId;
    this.artistName = artistName || this.artistName;
    
    const config = this.gameConfigService.getConfig();
    this.playDuration = this.getDurationFromDifficulty(config.difficulty);
    
    // Use artist information to fetch and play the song
    await this.fetchAndPlaySong(this.artistId);
  }

  getAudioSource(): string {
    // Construct the audio source URL based on artist information
    return `https://api.spotify.com/v1/artists/${this.artistId}/top-tracks?market=US`;
  }

  async fetchAndPlaySong(artistId: string) {
    try {
      const token = await getSpotifyToken();
      if (!token) {
        throw new Error("Failed to retrieve Spotify access token");
      }
  
      const tracksResponse = await request(
        `https://api.spotify.com/v1/artists/${artistId}/top-tracks`,
        {
          headers: { Authorization: `Bearer ${token}` },
          params: { market: "US" },
        }
      );
  
      console.log('API Response:', tracksResponse); // Log the entire response
  
      if (
        tracksResponse &&
        tracksResponse.tracks &&
        tracksResponse.tracks.length > 0
      ) {
        this.audioSrc = tracksResponse.tracks[0].preview_url;
        console.log('Audio Source URL:', this.audioSrc); // Log the audio source URL
        this.playSong();
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

    setTimeout(() => audio.pause(), this.playDuration);
  }
}
