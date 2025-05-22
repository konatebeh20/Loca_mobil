import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private _storage: Storage | null = null;
  api_url = environment.apiUrl

  constructor(
    private http: HttpClient,
    private storage: Storage
  ) { 
    this.init();
  }

  // Initialize Ionic Storage
  async init() {
    // this._storage = await this.storage.create();
    this._storage = await this.storage['create']();
  }

//  login(body: any) {
//     return this.http.post(this.api_url+"/api/users/loginuser", body);
//   }

  // Save token to storage
  async saveToken(token_name: string, token: string): Promise<void> {
    // await this._storage?.set(token_name, token);
    await this._storage?.['set'](token_name, token);
  }

  // Get token from storage
  async getToken(token_name: string): Promise<string | null> {
    // return await this._storage?.get(token_name);
    return await this._storage?.['get'](token_name);
  }

  // Remove token from storage
  async removeToken(token_name: string): Promise<void> {
    // await this._storage?.remove(token_name);
    await this._storage?.['remove'](token_name);
  }

  // Check if the user is logged in
  async isLoggedIn(): Promise<boolean> {
    const token = await this.getToken('isLoggedIn');
    return !!token; // Returns true if token exists
  }
  // Check if the user is logged in
  async hasPassedIntro(): Promise<boolean> {
    const token = await this.getToken('KL_PASS_INTRO');
    return !!token; // Returns true if token exists
  }
  // Check if the user is logged in
  async hasAdminInfo(): Promise<boolean> {
    const token = await this.getToken('admin_infos');
    return !!token; // Returns true if token exists
  }

  logout() {
    // Logique de déconnexion
  }

  register(body: any) {
    return this.http.post(`${this.api_url}/api/users/register`, body);
  }
  
}
