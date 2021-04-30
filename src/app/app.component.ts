import { Component } from '@angular/core';
import {DataService} from "./data.service";
import {Result, ScraperService} from "./scraper.service";
import {Observable} from "rxjs";

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'toy-scraper';

  results$: Observable<Result[][]>;

  constructor(private scraperService: ScraperService) {

    this.results$ = this.scraperService.results$;

    this.scraperService.scrapeKeyword(
      // 'bf13341'
      'rm8743'
    );
  }
}
