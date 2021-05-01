import { Injectable } from '@angular/core';
import {DataService} from "./data.service";
import {map, tap} from "rxjs/operators";
import {BehaviorSubject, forkJoin, Observable} from "rxjs";

export interface Config {
  url: string;
  parserFunction: (doc: Document) => Result[];
  appName: string;
}

export interface Result {
  name: string;
  articleNumber: string;
}

export interface OnApp {
  [appName: string]: boolean;
}

const spanParser = (doc: Document) => {
  const result = doc.querySelectorAll('.js-prod-grid_item .prod-tile.prod-tile--full.js-prod-tile');
  const articleNumbers: Result[] = [];

  result?.forEach(item => {
    const attribute = item.getAttribute('data-product');
    const parts = attribute?.split(';');
    if (parts) {
      articleNumbers.push({
        name: item.textContent ? item.textContent : 'unknown',
        articleNumber: parts[1]
      });
    }
  })

  return articleNumbers;
};

const linkParser = (doc: Document) => {
  const result = doc.querySelectorAll('.prod-tile__link.js-prodlink');

  const articleNumbers: Result[] = [];

  result?.forEach(item => {
    const match = item?.getAttribute('href')?.match(/(\d+).html$/);
    if (match) {
      articleNumbers.push({
        name: item.textContent ? item.textContent : 'unknown',
        articleNumber: match[1]
      });
    }
  })

  return articleNumbers;
}

@Injectable({
  providedIn: 'root'
})
export class ScraperService {

  config: Config[] = [
    { url: 'https://www.mytoys.de/suche', parserFunction: spanParser, appName: 'mytoys' },
    { url: 'https://www.mirapodo.de/suche/', parserFunction: spanParser, appName: 'mirapodo' },
    { url: 'https://www.yomonda.de/suche', parserFunction: linkParser, appName: 'yomonda' }
  ]

  results$ = new BehaviorSubject<{ [key: string]: Result[]}>({});
  resultsAll$: Observable<{ [articleNumber: string]: OnApp }>;
  dataLoaded$ = new BehaviorSubject<boolean>(false);
  dataLoading$ = new BehaviorSubject<boolean>(false);

  constructor(private dataService: DataService) {
    this.resultsAll$ = this.results$.pipe(
      map((results) => {
        return Object.keys(results).reduce((object, appName) => {
          results[appName].forEach(article => {
            object[article.articleNumber] =
              object[article.articleNumber] || {};
              object[article.articleNumber][appName] = true;
          });

          return object;
        }, {} as { [articleNumber: string]: OnApp});
      })
    )
  }

  scrapeKeyword(searchTerm: string) {
    this.dataLoading$.next(true);

    forkJoin(this.config.reduce((acc, config) => {
        return {...acc, [config.appName]: this.scrapeWebsite(searchTerm, config) }
      }, {}) )
      .pipe(tap(() => {
        this.dataLoaded$.next(true);
        this.dataLoading$.next(false)
      }))
        .subscribe(result => this.results$.next(result));
  }

  scrapeWebsite(searchTerm: string, config: Config) {
    return this.dataService.query(config.url, searchTerm)
      .pipe(
        map((text) => {
          const domParser = new DOMParser();
          return domParser.parseFromString(text, 'text/html');
        }),
        map(config.parserFunction),
        map(result => result.sort((a, b) =>  a.articleNumber > b.articleNumber ? 1 : a.articleNumber < b.articleNumber ? -1 : 0 ))
      );
  }
}
