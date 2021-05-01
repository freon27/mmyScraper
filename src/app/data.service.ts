import { Injectable } from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {Observable} from "rxjs";

@Injectable({
  providedIn: 'root'
})
export class DataService {

  constructor(private http: HttpClient) {
  }

  query(url: string, queryTerm: string): Observable<string> {
    return this.http.get(`${url}/${queryTerm}`, { responseType: "text"})
  }
}
