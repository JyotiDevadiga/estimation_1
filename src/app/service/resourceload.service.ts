import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class ResourceloadService {
  private apiUrl = 'https://rjn9hw68jj.execute-api.ap-south-1.amazonaws.com/dev/Resourceload'; // Replace with your API endpoint

  constructor(private http: HttpClient) {}

  // POST method to add new data
  addResourceLoadData(data: any): Observable<any> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.post(this.apiUrl, data, { headers }).pipe(
      catchError(error => {
        console.error('Error occurred while posting data:', error);
        return throwError(error);
      })
    );
  }

  // GET method to retrieve data
  getResourceLoadData(rfpNum: number): Observable<any[]> {
    const params = new HttpParams().set('RfpNum', rfpNum.toString());
    return this.http.get<any[]>(this.apiUrl, { params }).pipe(
      catchError(error => {
        console.error('Error occurred while fetching data:', error);
        return throwError(error);
      })
    );
  }

  // PUT method to update the total resources
  updateTotalResource(rfpNum: number, sum: number): Observable<any> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    const body = { rfp_no: rfpNum, sum };
    return this.http.put(this.apiUrl, body, { headers }).pipe(
      catchError(error => {
        console.error('Error occurred while updating data:', error);
        return throwError(error);
      })
    );
  }

  // DELETE method to delete a row
  deleteResourceLoadData(id: string, rfpNum: number): Observable<any> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    const options = {
      headers: headers,
      body: { id, RfpNum: rfpNum }
    };
    return this.http.request('delete', this.apiUrl, options).pipe(
      catchError(error => {
        console.error('Error occurred while deleting data:', error);
        return throwError(error);
      })
    );
  }
}
