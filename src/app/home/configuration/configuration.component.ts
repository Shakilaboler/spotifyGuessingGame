import { Component, OnInit } from "@angular/core";
import { Router } from "@angular/router";
import { HttpClient, HttpHeaders } from "@angular/common/http";
import { GameConfigService } from "src/services/game-config.service";
import { getSpotifyToken } from "src/services/api";

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
      this.fetchArtists(token);
    } else {
      console.error("Error retrieving Spotify token");
    }
  }

  fetchArtists(token: string) {
    if (!token) {
      console.error("No token available for Spotify API request");
      return;
    }

    const searchQuery = "genre:rock";

    if (!searchQuery) {
      console.error("Search query is empty");
      return;
    }

    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });
    const artistApiUrl = `https://api.spotify.com/v1/search?q=${encodeURIComponent(
      searchQuery
    )}&type=artist&limit=10`;

    this.http.get<any>(artistApiUrl, { headers }).subscribe(
      (response) => {
        this.artists = response.artists.items;
      },
      (error) => {
        console.error("Error fetching artists:", error);
      }
    );
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
