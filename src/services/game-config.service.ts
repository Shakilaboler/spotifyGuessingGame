import { Injectable } from "@angular/core";

@Injectable({
  providedIn: "root",
})
export class GameConfigService {
  private artist: string | null = null;
  private difficulty: string = "easy";
  private gameplayMode: string = "infinite";

  constructor() {}

  getGameplayMode(): string {
    return this.gameplayMode;
  }

  setGameplayMode(mode: string): void {
    this.gameplayMode = mode;
  }

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
