// leaderboard.component.ts

import { Component, OnInit } from "@angular/core";
import { Router } from "@angular/router";
import { AnswerTrackerService } from "src/services/answer-tracker.service";

interface RouterState {
  score: number;
}

@Component({
  selector: "app-leaderboard",
  templateUrl: "./leaderboard.component.html",
  styleUrls: ["./leaderboard.component.css"],
})
export class LeaderboardComponent implements OnInit {
  gameOverMessage: string;
  correctAnswers: number;
  userName: string;
  leaderboard: { name: string; score: number }[] = [];

  constructor(
    private router: Router,
    private answerTrackerService: AnswerTrackerService
  ) {
    this.gameOverMessage = "Game Over!";
    this.correctAnswers = 0;
    this.userName = "";
  }

  ngOnInit(): void {
    const navigation = this.router.getCurrentNavigation();
    const state = navigation?.extras.state as RouterState;
    this.correctAnswers = state ? state.score : 0;

    this.correctAnswers = this.answerTrackerService.getCorrectAnswerCount();

    this.loadLeaderboard();
  }

  onSubmit(): void {
    this.addToLeaderboard();

    this.saveLeaderboard();
  }

  private loadLeaderboard() {
    const savedLeaderboard = localStorage.getItem("leaderboard");

    if (savedLeaderboard) {
      this.leaderboard = JSON.parse(savedLeaderboard);
    }
  }

  private saveLeaderboard() {
    localStorage.setItem("leaderboard", JSON.stringify(this.leaderboard));
  }

  goToHomePage() {
    this.answerTrackerService.resetCorrectAnswers();
    this.router.navigate(["/home"]);
  }

  goToGamePlay() {
    this.answerTrackerService.resetCorrectAnswers();
    this.router.navigate(["/play"]);
  }

  clearLeaderboard() {
    this.leaderboard = [];

    this.saveLeaderboard();
  }

  addToLeaderboard(): void {
    if (this.userName.trim() === "") {
      return;
    }

    this.leaderboard.push({ name: this.userName, score: this.correctAnswers });

    this.leaderboard.sort((a, b) => b.score - a.score);
  }
}
