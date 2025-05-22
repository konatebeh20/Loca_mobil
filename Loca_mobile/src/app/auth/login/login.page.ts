import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonButton, IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonContent, IonHeader, IonIcon, IonInput, IonItem, IonLabel, IonTitle, IonToolbar } from '@ionic/angular/standalone';
import { Router, RouterLink } from '@angular/router';

import { AuthService } from 'src/app/services/auth/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  imports: [ 
    IonContent, IonHeader, IonTitle, IonToolbar,
    IonIcon, IonInput, IonButton, CommonModule, 
    FormsModule, RouterLink
  ]
})
export class LoginPage implements OnInit {

  constructor(
    private router: Router,
    private http: AuthService,
    // private authService: AuthService,
    // private loadingCtrl: LoadingController,
    // private toastController: ToastController,
    // private faio: FingerprintAIO,
    // private pushNotificationService: PushNotificationService

  ) { }

  ngOnInit() {
  }

  login() {
    // this.http.login();
  }

}
