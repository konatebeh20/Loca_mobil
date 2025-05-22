import { HttpClient } from '@angular/common/http';
import { HttpHeaders } from '@angular/common/module.d-CnjH8Dlt';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class UsersService {

  constructor(private http: HttpClient) { }
  
  api_url = environment.apiUrl
  
  CreateUser(body: any) {
    return this.http.post(this.api_url+"/api/users/createuser", body);
  }
  
  GetAllUsers(body: any) {
    return this.http.get(this.api_url+"/api/users/getallusers", body);
  }
  
  GetSingleUser(body: any) {
    return this.http.post(this.api_url+"/api/users/getsingleuser", body);
  }
  
  
  DeleteUsers(body: any) {
    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type':  'application/json',
         Authorization: ''
      }),
      body: JSON.stringify(body)
    };
    return this.http.delete(this.api_url+"/api/users/deleteuser", httpOptions);
  }
  
  UpdateUsers(body: any) {
      return this.http.patch(this.api_url+"/api/users/updateuser", body);
  }

}
