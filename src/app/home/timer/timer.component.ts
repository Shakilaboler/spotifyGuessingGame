import { Component, Input, OnInit, OnDestroy } from "@angular/core";

@Component({
  selector: "app-timer",
  templateUrl: "./timer.component.html",
  styleUrls: ["./timer.component.css"],
})
export class TimerComponent implements OnInit, OnDestroy {
  @Input() selectedDifficulty: string = "easy";

  initialTime: number = 0;
  timeRemaining: number = 0;
  timerInterval: any;

  constructor() {}

  ngOnInit(): void {
    this.initialTime = this.calculateInitialTime();
    this.timeRemaining = this.initialTime;
    this.startTimer();
  }

  ngOnDestroy(): void {
    clearInterval(this.timerInterval);
  }

  calculateInitialTime(): number {
    switch (this.selectedDifficulty) {
      case "easy":
        return 30; // 60 seconds for easy difficulty
      case "medium":
        return 20; // 45 seconds for medium difficulty
      case "hard":
        return 10; // 30 seconds for hard difficulty
      default:
        return 30; // Default to easy difficulty
    }
  }

  startTimer(): void {
    this.timerInterval = setInterval(() => {
      this.timeRemaining--;
      if (this.timeRemaining === 0) {
        this.resetTimer(); // Reset the timer when it reaches zero
      }
    }, 1000);
  }

  resetTimer(): void {
    clearInterval(this.timerInterval);
    this.timeRemaining = this.initialTime;
  }
}
