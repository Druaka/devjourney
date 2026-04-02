import {Injectable} from '@angular/core';
import {HttpClient, HttpParams} from '@angular/common/http';
import {Observable} from 'rxjs';
import {environment} from '@env/environment.local';

@Injectable({providedIn: 'root'})
export class TcgdexService {
    private cards: any[] = [];

    constructor(private http: HttpClient) {
    }

    fetchPtcgSets(params?: any): Observable<any> {
        let httpParams = new HttpParams();
        if (params) {
            Object.keys(params).forEach(key => {
                httpParams = httpParams.set(key, params[key]);
            });
        }
        return this.http.get(`${environment.apiUrl}/tcgdex/ptcg-sets`, {params: httpParams});
    }

    fetchTcgpSets(params?: any): Observable<any> {
        let httpParams = new HttpParams();
        if (params) {
            Object.keys(params).forEach(key => {
                httpParams = httpParams.set(key, params[key]);
            });
        }
        return this.http.get(`${environment.apiUrl}/tcgdex/tcgp-sets`, {params: httpParams});
    }

    setCards(cards: any[]): void {
        this.cards = cards;
    }

    getCards(): any[] {
        return this.cards;
    }
}
