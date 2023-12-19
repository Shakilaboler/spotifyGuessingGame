import { Component, OnInit } from "@angular/core";
import { Router } from "@angular/router";
import { getSpotifyToken, fetchFromSpotify } from "src/services/api";
import { GameConfigService } from "src/services/game-config.service";

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
    private gameConfigService: GameConfigService
  ) {}

  async ngOnInit() {
    await this.fetchArtists();
  }

  async fetchArtists() {
    try {
      const token = await getSpotifyToken();
      if (!token) {
        throw new Error("Spotify token not found");
      }

      const searchQuery = "";
      const artistApiUrl = `search?q=${encodeURIComponent(
        searchQuery
      )}&type=artist`;

      const artistsResponse = await fetchFromSpotify({
        token,
        endpoint: artistApiUrl,
      });

      if (
        artistsResponse &&
        artistsResponse.artists &&
        artistsResponse.artists.items
      ) {
        this.artists = artistsResponse.artists.items;
      } else {
        throw new Error("No artists found or invalid response structure");
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
