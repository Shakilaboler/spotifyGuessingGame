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

  constructor(private gameConfigService: GameConfigService) {}

  ngOnInit() {
    this.setupGame();
  }

  async setupGame() {
    const config = this.gameConfigService.getConfig();
    this.playDuration = this.getDurationFromDifficulty(config.difficulty);
    if (config.artist) {
      await this.fetchAndPlaySong(config.artist);
    }
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

      if (
        tracksResponse &&
        tracksResponse.tracks &&
        tracksResponse.tracks.length > 0
      ) {
        this.audioSrc = tracksResponse.tracks[0].preview_url;
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
