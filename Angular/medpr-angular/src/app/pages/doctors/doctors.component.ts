import { DoctorsService } from 'src/app/services/doctors/doctors.service';
import { Component } from '@angular/core';
import { Doctor } from 'src/app/models/doctor';
import { DoctorsActionsService } from 'src/app/services/doctors/doctors.actions.service';

import { inAnimation } from 'src/app/modules/animations/animations';
import { trigger, transition, useAnimation } from "@angular/animations";

@Component({
  selector: 'doctors',
  templateUrl: './doctors.component.html',
  styleUrls: ['./doctors.component.scss'],
  animations: [
    trigger('insert', [
      transition(':enter', [
        useAnimation(inAnimation)
      ])
    ]),
  ]
})
export class DoctorsComponent {
  doctors: Doctor[] = [];

  constructor(private DoctorsService: DoctorsService,
    private actions: DoctorsActionsService) {}

  ngOnInit() {
    this.DoctorsService.getAllDoctors().subscribe(doctors => this.doctors = doctors);

    this.actions.doctorResponseListner().subscribe(doctorFromAction => {
      const presentDoctor = this.doctors.find((presentDoctor) => {
        return presentDoctor.id === doctorFromAction.id;
      })
      if (!presentDoctor) {
        this.doctors.push(doctorFromAction);
      }
      else{
        this.doctors.splice(this.doctors.indexOf(presentDoctor), 1, doctorFromAction);
      }
    });

    this.actions.doctorDeleteListner().subscribe(doctorId => {
      const presentDoctor = this.doctors.find((presentDoctor) => {
        return presentDoctor.id === doctorId;
      })
      this.doctors.splice(this.doctors.indexOf(presentDoctor!), 1);
    });
  }
}
