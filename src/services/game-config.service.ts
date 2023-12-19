import { Injectable } from "@angular/core";

@Injectable({
  providedIn: "root",
})
export class GameConfigService {
  private artist: string | null = null;
  private difficulty: string = "easy";

  constructor() {}

  setArtist(artist: string | null) {
    this.artist = artist;
  }

  getArtist(): string | null {
    return this.artist;
  }

  setDifficulty(difficulty: string) {
    this.difficulty = difficulty;
  }

  getDifficulty(): string {
    return this.difficulty;
  }

  getConfig() {
    return {
      artist: this.artist,
      difficulty: this.difficulty,
    };
  }
}
