import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonButton, IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonContent, IonHeader, IonIcon, IonInput, IonItem, IonLabel, IonTitle, IonToolbar } from '@ionic/angular/standalone';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  standalone: true,
  imports: [ 
    IonContent, IonHeader, IonTitle, IonToolbar, 
    IonIcon, IonButton, CommonModule, FormsModule, 
    RouterLink
  ]
})
export class HomePage implements OnInit {

  constructor() { 
    // addIcons({
    //   car,
    //   logInOutline,
    //   personAddOutline
    // });
   }

  ngOnInit() {
  }

}
