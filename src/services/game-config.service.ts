import { Injectable } from "@angular/core";

@Injectable({
  providedIn: "root",
})
export class GameConfigService {
  private artist: string | null = null;
  private difficulty: string = "easy";
  private gameplayMode: string = "infinite";

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

  setGameplayMode(gameplayMode: string) {
    this.gameplayMode = gameplayMode;
  }

  getGameplayMode(): string {
    return this.gameplayMode;
  }

  getConfig() {
    return {
      artist: this.artist,
      difficulty: this.difficulty,
    };
  }
}
