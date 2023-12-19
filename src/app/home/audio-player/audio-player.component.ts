import { Component, OnInit, ViewChild, ElementRef } from "@angular/core";
import { GameConfigService } from "src/services/game-config.service";
import { HttpClient, HttpHeaders } from "@angular/common/http";

@Component({
  selector: "app-audio-player",
  templateUrl: "./audio-player.component.html",
  styleUrls: ["./audio-player.component.css"],
})
export class AudioPlayerComponent implements OnInit {
  @ViewChild("audioPlayer") audioPlayer!: ElementRef<HTMLAudioElement>;
  audioSrc: string = "";
  trackList: string[] = [];
  currentTrackIndex: number = 0;
  playDuration: number = 30000;

  constructor(
    private gameConfigService: GameConfigService,
    private http: HttpClient
  ) {}

  ngOnInit() {
    this.setupGame();
  }

  setupGame() {
    const config = this.gameConfigService.getConfig();
    this.playDuration = this.getDurationFromDifficulty(config.difficulty);
    if (config.artist) {
      this.fetchTopTracks(config.artist);
    }
  }

  fetchTopTracks(artistId: string) {
    const token = localStorage.getItem("whos-who-access-token");
    if (!token) {
      console.error("Spotify access token not found");
      return;
    }

    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });
    const topTracksUrl = `https://api.spotify.com/v1/artists/${artistId}/top-tracks?market=US`;

    this.http.get<any>(topTracksUrl, { headers }).subscribe(
      (response) => {
        this.trackList = response.tracks.map((track: any) => track.preview_url);
        this.playNextTrack();
      },
      (error) => {
        console.error("Error fetching top tracks:", error);
      }
    );
  }

  playNextTrack() {
    if (this.currentTrackIndex < this.trackList.length) {
      this.audioSrc = this.trackList[this.currentTrackIndex];
      this.currentTrackIndex++;
      this.playSong();
    } else {
      console.log("No more tracks to play");
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
    audio.src = this.audioSrc;
    audio.load();
    audio.play();

    setTimeout(() => {
      audio.pause();
      this.playNextTrack();
    }, this.playDuration);
  }
}
