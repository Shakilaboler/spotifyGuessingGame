import { Component, OnInit } from "@angular/core";
import { Router } from "@angular/router";
import { HttpClient } from "@angular/common/http";
import { GameConfigService } from "src/services/game-config.service";
import { getSpotifyToken, request } from "src/services/api";

const AUTH_ENDPOINT =
  "https://nuod0t2zoe.execute-api.us-east-2.amazonaws.com/FT-Classroom/spotify-auth-token";
const TOKEN_KEY = "whos-who-access-token";

@Component({
  selector: "app-configuration",
  templateUrl: "./configuration.component.html",
  styleUrls: ["./configuration.component.css"],
})
export class ConfigurationComponent implements OnInit {
  artists: any[] = [];
  selectedArtistId: string = "";
  selectedDifficulty: string = "easy";
  gameplayMode: string = "infinite";

  constructor(
    private router: Router,
    private http: HttpClient,
    private gameConfigService: GameConfigService
  ) {}

  async ngOnInit() {
    await this.authenticateAndFetchArtists();
  }

  async authenticateAndFetchArtists() {
    const token = await getSpotifyToken();
    if (token) {
      await this.fetchArtists(token);
    } else {
      console.error("Error retrieving Spotify token");
    }
  }

  async fetchArtists(token: string) {
    try {
      const artistApiUrl = `https://api.spotify.com/v1/some-artist-endpoint`;

      const response = await request(artistApiUrl, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response && response.artists && response.artists.items) {
        this.artists = response.artists.items;
      } else {
        console.error("No artists found or invalid response structure");
      }
    } catch (error) {
      console.error("Error fetching artists:", error);
    }
  }

  onArtistSelection(artistId: string) {
    this.selectedArtistId = artistId;
  }

  submitConfig() {
    this.gameConfigService.setArtist(this.selectedArtistId);
    this.gameConfigService.setDifficulty(this.selectedDifficulty);
    console.log("Game configuration saved");
    this.router.navigate(["/play"]);
  }

  navigateToHome() {
    this.router.navigate(["/home"]);
  }
}
