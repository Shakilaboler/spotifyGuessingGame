import { Component, OnInit } from "@angular/core";
import { Router } from "@angular/router";
import { AudioPlayerComponent } from "../audio-player/audio-player.component";

@Component({
  selector: "app-game-play",
  templateUrl: "./game-play.component.html",
  styleUrls: ["./game-play.component.css"],
})
export class GamePlayComponent implements OnInit {
  audioSrc: string;
  countdown: number;
  answers: string[];
  selectedAnswer: string = "";
  isCorrectAnswer: boolean = false;
  gameplayMode: string;
  questionsRemaining: number;
  showGamePlay: boolean = false;

  constructor(private router: Router) {
    this.audioSrc = "";
    this.countdown = 30;
    this.answers = ["Answer 1", "Answer 2", "Answer 3", "Answer 4"];
    this.gameplayMode = "infinite";
    this.questionsRemaining = 10;
  }

  ngOnInit(): void {}

  onAnswerSelect(answer: string): void {
    this.selectedAnswer = answer;
    this.checkAnswer();
  }

  checkAnswer(): void {
    this.isCorrectAnswer = true;

    if (this.gameplayMode === "infinite" && !this.isCorrectAnswer) {
      this.router.navigate(["/game-over"]);
    } else if (this.gameplayMode === "quiz") {
      this.questionsRemaining -= 1;
      if (this.questionsRemaining === 0 || !this.isCorrectAnswer) {
        this.router.navigate(["/game-over"]);
      }
      // Otherwise, load the next question
    }
  }
}
