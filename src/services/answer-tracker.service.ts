import { Injectable } from "@angular/core";

@Injectable({
  providedIn: "root",
})
export class AnswerTrackerService {
  private correctAnswerCount: number = 0;

  getCorrectAnswerCount(): number {
    return this.correctAnswerCount;
  }

  resetCorrectAnswers(): void {
    this.correctAnswerCount = 0;
  }

  incrementCorrectAnswerCount(): void {
    this.correctAnswerCount++;
  }
}
