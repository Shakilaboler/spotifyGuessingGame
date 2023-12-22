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
  getSpotifyToken,
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

      const featuredPlaylistTracksEndpoint = `playlists/${featuredPlaylistId}/tracks`;
      const featuredPlaylistTracksResponse = await fetchFromSpotify({
        token,
        endpoint: featuredPlaylistTracksEndpoint,
      });

      if (featuredPlaylistTracksResponse?.items?.length > 0) {
        const randomIndex = Math.floor(
          Math.random() * featuredPlaylistTracksResponse.items.length
        );

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

    return null;
  } catch (error) {
    console.error("Error fetching additional wrong answer:", error);

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
  currentTrack: any;
  playDuration: number = 0;
  timer: number = 0;
  timerInterval: any;
  selectedDifficulty: string = "";
  initialTime: number = 0;
  timeRemaining: number = 0;
  showAlbumArt: boolean = false;
  isLoading: boolean = false;
  answerMessage: string = "";

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
    this.questionsRemaining = 5;
    this.currentTrack = {};
    this.selectedDifficulty = this.gameConfigService.getDifficulty();

    this.initialTime = this.calculateInitialTime();
  }

  ngOnDestroy(): void {
    clearInterval(this.timerInterval);
  }

  calculateInitialTime(): number {
    if (this.selectedDifficulty === "easy") {
      return 30;
    } else if (this.selectedDifficulty === "medium") {
      return 20;
    } else if (this.selectedDifficulty === "hard") {
      return 10;
    } else {
      return 0;
    }
  }

  ngOnInit(): void {
    this.isLoading = true;
    this.getNewQuestion();
    this.startTimer();
    this.showGamePlay = true;
    this.isLoading = false;
  }

  ngAfterViewInit(): void {
    if (this.audioPlayer && this.currentTrack.artistId) {
      this.audioPlayer.setupGame(
        this.currentTrack.artistId,
        this.currentTrack.artistName
      );
    }
  }

  onAudioLoaded(): void {
    this.startTimer();
  }

  startTimer() {
    this.timer = this.playDuration / 1000;

    this.timerInterval = setInterval(() => {
      this.ngZone.run(() => {
        this.timer--;
        if (this.timer === 0) {
          this.resetTimer();
        }
      });
    }, 1000);
  }

  resetTimer() {
    clearInterval(this.timerInterval);
    this.timer = this.initialTime;
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

          this.currentTrack = {
            albumArtUrl: firstTrack.album.images[0].url,
            correctAnswer: "",
            artistId: firstTrack.artists[0].id,
            artistName: firstTrack.artists[0].name,
          };

          const artistNames = firstTrack.artists
            .map((artist: { name: string }) => artist.name)
            .join(", ");
          const trackName = firstTrack.name;

          this.currentTrack.correctAnswer = `${trackName} by ${artistNames}`;

          this.answers = await this.generateAnswerChoices();

          if (!this.answers.includes(this.currentTrack.correctAnswer)) {
            this.answers[Math.floor(Math.random() * this.answers.length)] =
              this.currentTrack.correctAnswer;
          }

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

            return null;
          }
          this.resetTimer();
          this.startTimer();
        } else {
          console.error(
            'No items found in the "items" array of Tracks Response'
          );
        }
      } else {
        console.error("No featured playlists found in the response");
      }

      return this.currentTrack;
    } catch (error) {
      console.error("Error fetching new question:", error);

      return null;
    }
  }

  async generateAnswerChoices(): Promise<string[]> {
    try {
      if (!this.currentTrack || !this.currentTrack.correctAnswer) {
        console.error("Current track or correct answer is missing");
        return [] as string[];
      }

      const answers = await getWrongAnswers(this.currentTrack);

      console.log("Correct Answer:", this.currentTrack.correctAnswer);
      console.log("Current Track:", this.currentTrack);

      if (answers && answers.wrong) {
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

        const filteredWrongAnswers = wrongAnswers.filter(
          (wrongAnswer) => wrongAnswer !== ""
        );

        while (filteredWrongAnswers.length < 1) {
          const additionalWrongAnswer = await getAdditionalWrongAnswer(
            this.currentTrack
          );
          console.log("Additional Wrong Answer:", additionalWrongAnswer);

          if (!additionalWrongAnswer) {
            console.error("Error fetching additional wrong answer");
            return [] as string[];
          }

          if (!filteredWrongAnswers.includes(additionalWrongAnswer)) {
            filteredWrongAnswers.push(additionalWrongAnswer);
          }
        }

        const choices: string[] = [
          ...filteredWrongAnswers,
          this.currentTrack.correctAnswer,
        ];

        while (choices.length < 4) {
          const additionalWrongAnswer = await getAdditionalWrongAnswer(
            this.currentTrack
          );
          console.log("Additional Wrong Answer:", additionalWrongAnswer);

          if (!additionalWrongAnswer) {
            console.error("Error fetching additional wrong answer");
            return [] as string[];
          }

          if (!choices.includes(additionalWrongAnswer)) {
            choices.push(additionalWrongAnswer);
          }
        }

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
    this.checkAnswer().then();
    this.showAlbumArt = true;
    this.isLoading = true;
  }

  userScore: number = 0;

  async checkAnswer(): Promise<void> {
    this.isCorrectAnswer =
      this.selectedAnswer === this.currentTrack.correctAnswer;

    this.answerMessage = this.isCorrectAnswer ? "Correct!" : "Incorrect!";

    this.showAlbumArt = true;
    this.isLoading = true;
    setTimeout(() => {
      if (this.isCorrectAnswer) {
        this.userScore++;
        this.answerTrackerService.incrementCorrectAnswerCount();
      }

      this.showAlbumArt = false;
      this.isLoading = false;
      this.endOfQuestion();
    }, 5000);
  }

  async endOfQuestion() {
    if (this.gameplayMode === "quiz") {
      this.questionsRemaining -= 1;

      if (this.questionsRemaining > 0) {
        await this.getNewQuestion();
        this.timerComponent.resetTimer();
        this.timerComponent.startTimer();
      } else {
        this.navigateToLeaderboard();
      }
    } else if (this.gameplayMode === "infinite") {
      if (!this.isCorrectAnswer) {
        this.navigateToLeaderboard();
      } else {
        await this.getNewQuestion();
        this.timerComponent.resetTimer();
        this.timerComponent.startTimer();
      }
    }
  }

  navigateToLeaderboard() {
    this.router.navigate(["/leaderboard"], {
      state: { score: this.userScore },
    });
  }

  navigateToHome() {
    this.router.navigate(["/home"]);
  }
}
