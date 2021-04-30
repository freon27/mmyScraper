import { Injectable } from '@angular/core';
import {DataService} from "./data.service";
import {map, tap} from "rxjs/operators";
import {BehaviorSubject, forkJoin, Observable} from "rxjs";

export interface Config {
  url: string;
  parserFunction: (doc: Document) => Result[];
}

export interface Result {
  name: string;
  articleNumber: string;
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
    { url: 'https://www.mytoys.de/suche', parserFunction: spanParser },
    { url: 'https://www.mirapodo.de/suche/', parserFunction: spanParser },
    { url: 'https://www.yomonda.de/suche', parserFunction: linkParser }
  ]

  results$ = new BehaviorSubject<Result[][]>([]);

  constructor(private dataService: DataService) {
  }

  scrapeKeyword(searchTerm: string) {
    console.log('scrapeKeyword');
      forkJoin(this.config.map((config) => this.scrapeWebsite(searchTerm, config)) )
        .subscribe(result => this.results$.next(result));
  }

  scrapeWebsite(searchTerm: string, config: Config) {
    return this.dataService.query(config.url, searchTerm)
      .pipe(
        tap(projectedValue => console.log('text,', projectedValue)),
        map((text) => {
          const domParser = new DOMParser();
          return domParser.parseFromString(text, 'text/html');
        }),
        map(config.parserFunction),
        map(result => result.sort())
      );
  }
}
