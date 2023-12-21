// game-play.component.ts

import {
  AfterViewInit,
  Component,
  OnInit,
  ViewChild,
  NgZone,
} from "@angular/core";
import { Router } from "@angular/router";
import {
  fetchFromSpotify,
  fetchTopTracksOfArtist,
  getSpotifyToken,
  getRandomTrack,
  getWrongAnswers,
  Track,
} from "../../../services/api";
import { AnswerTrackerService } from "src/services/answer-tracker.service";
import { AudioPlayerComponent } from "../audio-player/audio-player.component";
import { GameConfigService } from "src/services/game-config.service";
import { TimerComponent } from "../timer/timer.component";

async function getAdditionalWrongAnswer(
  correctTrack: Track
): Promise<string | null> {
  try {
    const token = await getSpotifyToken();

    // Fetch featured playlists to get an additional wrong answer
    const featuredPlaylistsEndpoint = "browse/featured-playlists";
    const featuredPlaylistsParams = { limit: 1 };
    const featuredPlaylistsResponse = await fetchFromSpotify({
      token,
      endpoint: featuredPlaylistsEndpoint,
      params: featuredPlaylistsParams,
    });

    if (
      featuredPlaylistsResponse?.playlists?.items?.length > 0 &&
      featuredPlaylistsResponse.playlists.items[0].id
    ) {
      const featuredPlaylistId =
        featuredPlaylistsResponse.playlists.items[0].id;

      // Fetch tracks from the featured playlist
      const featuredPlaylistTracksEndpoint = `playlists/${featuredPlaylistId}/tracks`;
      const featuredPlaylistTracksResponse = await fetchFromSpotify({
        token,
        endpoint: featuredPlaylistTracksEndpoint,
      });

      if (featuredPlaylistTracksResponse?.items?.length > 0) {
        // Select a random track index
        const randomIndex = Math.floor(
          Math.random() * featuredPlaylistTracksResponse.items.length
        );

        // Ensure the selected track is different from the correct track
        if (
          featuredPlaylistTracksResponse.items[randomIndex].track.name !==
            correctTrack.name ||
          featuredPlaylistTracksResponse.items[randomIndex].track.artists[0]
            ?.name !== correctTrack.artists[0]?.name
        ) {
          return `${featuredPlaylistTracksResponse.items[randomIndex].track.name} by ${featuredPlaylistTracksResponse.items[randomIndex].track.artists[0]?.name}`;
        }
      }

      console.error(
        "No additional wrong tracks found in the featured playlist response"
      );
    } else {
      console.error("No featured playlists found in the response");
    }

    // Return null if unable to fetch an additional wrong answer
    return null;
  } catch (error) {
    console.error("Error fetching additional wrong answer:", error);

    // Return null in case of an error
    return null;
  }
}

@Component({
  selector: "app-game-play",
  templateUrl: "./game-play.component.html",
  styleUrls: ["./game-play.component.css"],
})
export class GamePlayComponent
  implements OnInit, AfterViewInit, TimerComponent
{
  countdown: number;
  answers: string[];
  selectedAnswer: string = "";
  isCorrectAnswer: boolean = false;
  gameplayMode: string;
  questionsRemaining: number;
  showGamePlay: boolean = false;
  currentTrack: any; // Add this property to store the current track information
  playDuration: number = 0;
  timer: number = 0;
  timerInterval: any;
  selectedDifficulty: string = "";
  initialTime: number = 0;
  timeRemaining: number = 0;

  @ViewChild(AudioPlayerComponent) audioPlayer!: AudioPlayerComponent;
  @ViewChild(TimerComponent) timerComponent!: TimerComponent;

  constructor(
    private router: Router,
    private answerTrackerService: AnswerTrackerService,
    private gameConfigService: GameConfigService,
    private ngZone: NgZone
  ) {
    this.countdown = 30;
    this.answers = [];
    this.gameplayMode = "infinite";
    this.questionsRemaining = 10;
    this.currentTrack = {};
    this.selectedDifficulty = this.gameConfigService.getDifficulty();

    // Calculate the initial time based on the selected difficulty
    this.initialTime = this.calculateInitialTime();
  }

  ngOnDestroy(): void {
    clearInterval(this.timerInterval);
  }

  calculateInitialTime(): number {
    if (this.selectedDifficulty === "easy") {
      return 30; // Set the initial time to 30 seconds for easy difficulty
    } else if (this.selectedDifficulty === "medium") {
      return 20; // Set the initial time to 20 seconds for medium difficulty
    } else if (this.selectedDifficulty === "hard") {
      return 15; // Set the initial time to 15 seconds for hard difficulty
    } else {
      // Handle any other cases or unknown difficulties here
      return 0; // Return 0 if the difficulty is unknown or not provided
    }
  }

  ngOnInit(): void {
    this.getNewQuestion();
    this.startTimer();
    this.showGamePlay = true;
  }

  ngAfterViewInit(): void {
    // Ensure the audioPlayer is defined before calling setupGame
    if (this.audioPlayer && this.currentTrack.artistId) {
      this.audioPlayer.setupGame(
        this.currentTrack.artistId,
        this.currentTrack.artistName
      );
    }
  }

  startTimer() {
    this.timer = this.playDuration / 1000; // Initialize the timer with the duration in seconds

    this.timerInterval = setInterval(() => {
      this.ngZone.run(() => {
        this.timer--; // Decrement the timer
        if (this.timer === 0) {
          this.resetTimer(); // Reset the timer when it reaches 0
        }
      });
    }, 1000); // Update the timer every 1 second
  }

  resetTimer() {
    clearInterval(this.timerInterval); // Clear the timer interval
    this.timer = this.playDuration / 1000; // Reset the timer value
  }

  async getNewQuestion() {
    try {
      const token = await getSpotifyToken();
      const endpointFeaturedPlaylists = "browse/featured-playlists";
      const featuredPlaylistsResponse = await fetchFromSpotify({
        token,
        endpoint: endpointFeaturedPlaylists,
      });
      const playlists = featuredPlaylistsResponse?.playlists?.items;
      if (playlists && playlists.length > 0) {
        const randomPlaylist =
          playlists[Math.floor(Math.random() * playlists.length)];
        const playlistId = randomPlaylist.id;
        const endpointTracks = `playlists/${playlistId}/tracks`;
        console.log("Endpoint Tracks:", endpointTracks);
        console.log("Spotify Token:", token);
        const tracksResponse = await fetchFromSpotify({
          token,
          endpoint: endpointTracks,
        });
        console.log("Tracks Response:", tracksResponse);

        if (tracksResponse?.items?.length > 0) {
          const firstTrack = tracksResponse.items[0].track;

          // Set relevant information to the currentTrack property
          this.currentTrack = {
            albumArtUrl: firstTrack.album.images[0].url,
            correctAnswer: "",
            artistId: firstTrack.artists[0].id, // Add artist ID
            artistName: firstTrack.artists[0].name, // Add artist name
            // Add other relevant properties here
          };

          const artistNames = firstTrack.artists
            .map((artist: { name: string }) => artist.name)
            .join(", ");
          const trackName = firstTrack.name;

          // Set the correct answer
          this.currentTrack.correctAnswer = `${trackName} by ${artistNames}`;

          // Generate answer choices
          this.answers = await this.generateAnswerChoices();

          // Make sure the correct answer is in the list of choices
          if (!this.answers.includes(this.currentTrack.correctAnswer)) {
            this.answers[Math.floor(Math.random() * this.answers.length)] =
              this.currentTrack.correctAnswer;
          }

          // Pass artist information to AudioPlayerComponent
          if (this.currentTrack.artistId) {
            this.audioPlayer.setupGame(
              this.currentTrack.artistId,
              this.currentTrack.artistName
            );
          } else {
            console.error(
              "Artist ID is null or undefined. Current Track:",
              this.currentTrack
            );
            // Handle the case where artistId is undefined, if necessary
            return null;
          }
        } else {
          console.error(
            'No items found in the "items" array of Tracks Response'
          );
        }
      } else {
        console.error("No featured playlists found in the response");
      }

      // Return the currentTrack object
      return this.currentTrack;
    } catch (error) {
      console.error("Error fetching new question:", error);
      // Return null or handle the error as needed
      return null;
    }
  }

  async generateAnswerChoices(): Promise<string[]> {
    try {
      if (!this.currentTrack || !this.currentTrack.correctAnswer) {
        console.error("Current track or correct answer is missing");
        return [] as string[];
      }

      // Step 2: Get wrong answers
      const answers = await getWrongAnswers(this.currentTrack);

      console.log("Correct Answer:", this.currentTrack.correctAnswer);
      console.log("Current Track:", this.currentTrack);

      if (answers && answers.wrong) {
        // Map wrong answers from the response
        const wrongAnswers: string[] = answers.wrong.map(
          (wrongTrack: Track | undefined) => {
            if (
              wrongTrack &&
              wrongTrack.name &&
              wrongTrack.artists?.length > 0 &&
              wrongTrack.artists[0]?.name
            ) {
              return `${wrongTrack.name} by ${wrongTrack.artists[0].name}`;
            }
            return "";
          }
        );

        // Remove empty strings from wrong answers
        const filteredWrongAnswers = wrongAnswers.filter(
          (wrongAnswer) => wrongAnswer !== ""
        );

        // Ensure you have at least 1 unique wrong answer
        while (filteredWrongAnswers.length < 1) {
          const additionalWrongAnswer = await getAdditionalWrongAnswer(
            this.currentTrack
          );
          console.log("Additional Wrong Answer:", additionalWrongAnswer);

          // Handle the case where an additional wrong answer cannot be fetched
          if (!additionalWrongAnswer) {
            console.error("Error fetching additional wrong answer");
            return [] as string[];
          }

          if (!filteredWrongAnswers.includes(additionalWrongAnswer)) {
            filteredWrongAnswers.push(additionalWrongAnswer);
          }
        }

        // Add the correct answer to the choices
        const choices: string[] = [
          ...filteredWrongAnswers,
          this.currentTrack.correctAnswer,
        ];

        // Ensure there are exactly 4 choices
        while (choices.length < 4) {
          const additionalWrongAnswer = await getAdditionalWrongAnswer(
            this.currentTrack
          );
          console.log("Additional Wrong Answer:", additionalWrongAnswer);

          // Handle the case where an additional wrong answer cannot be fetched
          if (!additionalWrongAnswer) {
            console.error("Error fetching additional wrong answer");
            return [] as string[];
          }

          if (!choices.includes(additionalWrongAnswer)) {
            choices.push(additionalWrongAnswer);
          }
        }

        // Shuffle the choices to randomize the order
        for (let i = choices.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [choices[i], choices[j]] = [choices[j], choices[i]];
        }

        return choices;
      } else {
        console.error("No wrong tracks found in the response");
        return [] as string[];
      }
    } catch (error) {
      console.error("Error generating answer choices:", error);
      return [] as string[];
    }
  }

  onAnswerSelect(answer: string): void {
    this.selectedAnswer = answer;
    this.checkAnswer();
  }

  userScore: number = 0; // Add this property to keep track of the user's score

  async checkAnswer(): Promise<void> {
    this.isCorrectAnswer =
      this.selectedAnswer === this.currentTrack.correctAnswer;

    if (this.isCorrectAnswer) {
      // Increment the user's score for a correct answer
      this.userScore++;
      this.answerTrackerService.incrementCorrectAnswerCount();

      if (this.gameplayMode === "quiz") {
        this.questionsRemaining -= 1;

        if (this.questionsRemaining > 0) {
          // If there are more questions, fetch the next question
          await this.getNewQuestion();
          this.timerComponent.resetTimer();
        } else {
          // If no more questions, navigate to the leaderboard
          this.navigateToLeaderboard();
        }
      } else {
        // For infinite mode, just fetch the next question
        await this.getNewQuestion();
        this.timerComponent.resetTimer();
      }
    } else {
      // If the answer is wrong, navigate to the leaderboard
      this.navigateToLeaderboard();
    }
  }

  navigateToLeaderboard() {
    // Navigate to leaderboard and pass the score
    this.router.navigate(["/leaderboard"], {
      state: { score: this.userScore },
    });
  }

  navigateToHome() {
    this.router.navigate(["/home"]);
  }
}
