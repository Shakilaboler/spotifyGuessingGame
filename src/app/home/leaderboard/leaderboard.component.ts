// leaderboard.component.ts

import { Component, OnInit } from "@angular/core";
import { Router } from "@angular/router";
import { AnswerTrackerService } from "src/services/answer-tracker.service";

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
    // Retrieve the number of correct answers from the AnswerTrackerService
    this.correctAnswers = this.answerTrackerService.getCorrectAnswerCount();
    // Retrieve leaderboard data from a service or storage
    this.loadLeaderboard();
  }

  onSubmit(): void {
    // Add the user's name and score to the leaderboard
    this.addToLeaderboard();

    this.saveLeaderboard();
  }

  private loadLeaderboard() {
    // Load leaderboard from localStorage
    const savedLeaderboard = localStorage.getItem("leaderboard");

    if (savedLeaderboard) {
      this.leaderboard = JSON.parse(savedLeaderboard);
    }
  }

  private saveLeaderboard() {
    // Save leaderboard to localStorage
    localStorage.setItem("leaderboard", JSON.stringify(this.leaderboard));
  }

  goToHomePage() {
    // Navigate to the home page
    this.answerTrackerService.resetCorrectAnswers();
    this.router.navigate(["/home"]);
  }

  clearLeaderboard() {
    // Clear the leaderboard
    this.leaderboard = [];

    // Save the empty leaderboard to localStorage
    this.saveLeaderboard();
  }

  addToLeaderboard(): void {
    // Validate if a user name is provided
    if (this.userName.trim() === "") {
      // Handle the case where the user name is empty
      return;
    }

    // Add the user to the leaderboard
    this.leaderboard.push({ name: this.userName, score: this.correctAnswers });

    // Sort the leaderboard based on scores in descending order
    this.leaderboard.sort((a, b) => b.score - a.score);

    // Update leaderboard data in a service or storage if needed
  }
}
