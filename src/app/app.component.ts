import { Component } from '@angular/core';
import {OnApp, Result, ScraperService} from "./scraper.service";
import {Observable} from "rxjs";
import {map, take} from "rxjs/operators";
import {Clipboard} from "@angular/cdk/clipboard";
import {FormControl, FormGroup} from "@angular/forms";
import {MatSnackBar, MatSnackBarModule} from "@angular/material/snack-bar";



@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  results$: Observable<{ [key: string]: Result[]}>;
  resultsAll$: Observable<{ [articleNumber: string]: OnApp }>
  allArticleNumber$: Observable<string[]>;
  appNames$: Observable<string[]>;
  dataLoaded$: Observable<boolean>;
  dataLoading$: Observable<boolean>;

  searchForm = new FormGroup({ search: new FormControl() });

  constructor(private scraperService: ScraperService, private clipboard: Clipboard, private snackbarService: MatSnackBar) {

    this.results$ = this.scraperService.results$;
    this.appNames$ = this.results$.pipe(map(result => Object.keys(result)));
    this.resultsAll$ = this.scraperService.resultsAll$;
    this.allArticleNumber$ = this.resultsAll$.pipe(map(results => Object.keys(results).sort()));
    this.dataLoaded$ = this.scraperService.dataLoaded$;
    this.dataLoading$ = this.scraperService.dataLoading$;

    this.scraperService.captchaError$.subscribe((appName) => this.snackbarService.open(`ERROR: Captcha required for ${appName}`, 'close'))

    // this.searchForm.valueChanges.subscribe((term) => {
    //   this.scraperService.scrapeKeyword(
    //     term
    //     // 'bf13341'
    //     // 'rm8743'
    //   );
    // });
  }

  copyArticleNumbers(app: string) {
    this.results$.pipe(take(1)).subscribe(results => {
      this.clipboard.copy(results[app].map(result => result.articleNumber).join('\n'));
      this.clipboardConfirm();
    })
  }

  copyAllArticleNumbers() {
    this.allArticleNumber$.pipe(take(1)).subscribe(allNumbers => {
      this.clipboard.copy(allNumbers.join('\n'));
      this.clipboardConfirm();
    })
  }

  clipboardConfirm() {
    this.snackbarService.open('copied to clipboard', '', { duration: 1500})
  }

  submitSearch() {
    this.scraperService.scrapeKeyword(this.searchForm.value['search']);
  }
}
