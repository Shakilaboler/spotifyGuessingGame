import { NgModule } from "@angular/core";
import { BrowserModule } from "@angular/platform-browser";
import { FormsModule } from "@angular/forms";
import { RouterModule, Routes } from "@angular/router";
import { AppComponent } from "./app.component";
import { HomeComponent } from "./home/home.component";
import { AudioPlayerComponent } from "./home/audio-player/audio-player.component";
import { ConfigurationComponent } from "./home/configuration/configuration.component";
import { GamePlayComponent } from "./home/game-play/game-play.component";
import { LeaderboardComponent } from "./home/leaderboard/leaderboard.component";
import { HttpClientModule } from "@angular/common/http";
import { TimerComponent } from './home/timer/timer.component';

const routes: Routes = [
  { path: "home", component: HomeComponent },
  { path: "configure", component: ConfigurationComponent },
  { path: "play", component: GamePlayComponent },
  { path: "leaderboard", component: LeaderboardComponent },
  { path: "", redirectTo: "/home", pathMatch: "full" },
];

@NgModule({
  declarations: [
    AppComponent,
    HomeComponent,
    AudioPlayerComponent,
    ConfigurationComponent,
    GamePlayComponent,
    LeaderboardComponent,
    TimerComponent,
  ],
  imports: [
    BrowserModule,
    FormsModule,
    RouterModule.forRoot(routes),
    HttpClientModule,
  ],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}
