import {Injectable} from '@angular/core';
import {DataService} from "./data.service";
import {concatAll, concatMap, delay, expand, map, mergeAll, mergeMap, tap, toArray} from "rxjs/operators";
import {BehaviorSubject, EMPTY, forkJoin, Observable, Subject} from "rxjs";

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
    {url: 'https://thingproxy.freeboard.io/fetch/https://www.mytoys.de/suche', parserFunction: spanParser, appName: 'mytoys'},
    {url: 'https://thingproxy.freeboard.io/fetch/https://www.mirapodo.de/suche/', parserFunction: spanParser, appName: 'mirapodo'},
    {url: 'https://thingproxy.freeboard.io/fetch/https://www.yomonda.de/suche', parserFunction: linkParser, appName: 'yomonda'}
  ]

  results$ = new BehaviorSubject<{ [key: string]: Result[] }>({});
  resultsAll$: Observable<{ [articleNumber: string]: OnApp }>;
  dataLoaded$ = new BehaviorSubject<boolean>(false);
  dataLoading$ = new BehaviorSubject<boolean>(false);
  captchaError$ = new Subject<string>();

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
        }, {} as { [articleNumber: string]: OnApp });
      })
    )
  }

  scrapeKeyword(searchTerm: string) {
    this.dataLoading$.next(true);

    forkJoin(this.config.reduce((acc, config) => {
      return {...acc, [config.appName]: this.scrapeWebsite(searchTerm, config)}
    }, {}))
      .pipe(tap(() => {
        this.dataLoaded$.next(true);
        this.dataLoading$.next(false)
      }))
      .subscribe(result => this.results$.next(result));
  }

  scrapeWebsite(searchTerm: string, config: Config): Observable<Result[]> {

    let pageNumber = 1;

    return this.getSearchPage(searchTerm, config, pageNumber)
      .pipe(
        expand((results) => {

          if (results.length) {
            pageNumber = pageNumber + 1;
            return this.getSearchPage(searchTerm, config, pageNumber).pipe(delay(3000));
          } else {
            return EMPTY;
          }
        }),
        toArray(),
        map(results => results.reduce((array, result) => {
          return array.concat(result);
        }, [])),
      )
  }

  getSearchPage(searchTerm: string, config: Config, page?: number): Observable<Result[]> {


    return this.dataService.query(config.url, searchTerm, page)
      .pipe(
        map((text) => {

          const domParser = new DOMParser();
          return domParser.parseFromString(text, 'text/html');
        }),
        tap(parser => {
          if (parser.querySelector('.g-recaptcha') !== null) {
            this.captchaError$.next(config.appName);
          }
        }),
        map(config.parserFunction))
  }
}
