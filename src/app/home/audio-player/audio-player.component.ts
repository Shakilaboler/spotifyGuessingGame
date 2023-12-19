import { Component, OnInit, ViewChild, ElementRef } from "@angular/core";
import { GameConfigService } from "src/services/game-config.service";
import { fetchFromSpotify } from "src/services/api";

@Component({
  selector: "app-audio-player",
  templateUrl: "./audio-player.component.html",
  styleUrls: ["./audio-player.component.css"],
})
export class AudioPlayerComponent implements OnInit {
  @ViewChild("audioPlayer") audioPlayer!: ElementRef<HTMLAudioElement>;
  audioSrc: string = "";
  playDuration: number = 30000;
  isArtistSelected: boolean = true;

  constructor(private gameConfigService: GameConfigService) {}

  ngOnInit() {
    this.setupGame();
  }

  setupGame() {
    const config = this.gameConfigService.getConfig();
    this.playDuration = this.getDurationFromDifficulty(config.difficulty);
    if (config.artist) {
      this.fetchAndPlaySong(config.artist);
    } else {
      this.isArtistSelected = false;
    }
  }

  async fetchAndPlaySong(artistId: string) {
    const token = localStorage.getItem("whos-who-access-token");
    if (!token) {
      console.error("Spotify access token not found");
      return;
    }

    try {
      const response = await fetchFromSpotify({
        token,
        endpoint: `artists/${artistId}/top-tracks`,
        params: { market: "US" },
      });

      if (response && response.tracks && response.tracks.length > 0) {
        this.audioSrc = response.tracks[0].preview_url;
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
