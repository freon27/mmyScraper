import { Injectable } from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {Observable} from "rxjs";

@Injectable({
  providedIn: 'root'
})
export class DataService {

  constructor(private http: HttpClient) {
  }

  query(url: string, queryTerm: string, page?: number): Observable<string> {
    const baseQuery = `${url}/${queryTerm}`;
    const searchQuery = page !== null ? `${baseQuery}?sort=scoring&page=${page}` : baseQuery;
    return this.http.get(searchQuery, { responseType: "text"})
  }
}
