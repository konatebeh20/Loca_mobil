import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { IonButton, IonCheckbox, IonContent, IonHeader, IonIcon, IonInput, IonItem, IonLabel, IonSelect, IonSelectOption, IonTitle, IonToolbar } from '@ionic/angular/standalone';
import { Router, RouterLink } from '@angular/router';

import { IonicModule, LoadingController } from '@ionic/angular';

import { UsersService } from 'src/app/services/users/users.service';

@Component({
  selector: 'app-register',
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss'],
  standalone: true,
  imports: [ 
    IonContent, IonHeader, IonTitle, IonToolbar,
    IonInput, IonButton, IonSelect, IonSelectOption, 
    IonCheckbox, CommonModule, FormsModule, ReactiveFormsModule, 
    RouterLink, IonicModule,
  ]
})
export class RegisterPage implements OnInit {

  constructor(
    // private http: UsersService,
    // private router: Router,
    // private loadingCtrl: LoadingController,
  ) { 
    // addIcons({
    //   car,
    //   personAddOutline,
    //   eyeOutline,
    //   eyeOffOutline
    // });
   }

  register_form: FormGroup = new FormGroup({

    fullname: new FormControl(null),
    username: new FormControl(null, Validators.required),
    password_hash: new FormControl(null, Validators.required),
    email: new FormControl(null, Validators.required),
    role: new FormControl(null, Validators.required),
    company_id: new FormControl(null, Validators.required),
    status: new FormControl('active', Validators.required),

  })

  ngOnInit() {
  }

  // Methode permettant d'afficher le patienteur
  // async showLoading() {
  //   const loading = await this.loadingCtrl.create({
  //     message: 'please wait...',
  //   });

  //   loading.present();
  // }

  // newUser(){
  //   if (this.register_form.invalid) {
  //     console.error('Form is invalid');
  //     return;
  //   }

  //   this.showLoading();

  //   const body = this.register_form.value
  //     this.http.CreateUser(body).subscribe({
  //     next: (res: any) => {
  //       console.log('User created:', res);
  //       // this.data= res?.user_info;
  //       this.router.navigate(['auth/registration-confirmation'])
  //     },
  //     error: (err) => {
  //       console.error('Registration failed:', err);
  //     },
  //     complete: () => {
  //       this.loadingCtrl.dismiss();
  //     }
  //   })
  // }

  // onRegister() {
  //   // Logique d'inscription à implémenter
  //   console.log('Registration form submitted');
  //   this.newUser();
  // }

}
