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
        return 30;
      case "medium":
        return 20;
      case "hard":
        return 10;
      default:
        return 30;
    }
  }

  startTimer(): void {
    this.timerInterval = setInterval(() => {
      this.timeRemaining--;
      if (this.timeRemaining === 0) {
        this.resetTimer();
      }
    }, 1000);
  }

  resetTimer(): void {
    clearInterval(this.timerInterval);
    this.timeRemaining = this.initialTime;
  }
}
