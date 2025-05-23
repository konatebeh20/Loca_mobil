import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class PreprocessingService {

  private scalerMeans: number[];
  private scalerStds: number[];
  
  constructor() { 
    this.scalerMeans = [];/* valeurs de mean_ du StandardScaler */
    this.scalerStds = [];/* valeurs de scale_ du StandardScaler */
   }

  normalize(data: number[]): number[] {
    return data.map((val, i) => (val - this.scalerMeans[i]) / this.scalerStds[i]);
  }
}
