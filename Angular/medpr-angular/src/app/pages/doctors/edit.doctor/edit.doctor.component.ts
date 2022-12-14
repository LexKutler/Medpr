import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { Doctor } from 'src/app/models/doctor';
import { DoctorsActionsService } from 'src/app/services/doctors/doctors.actions.service';
import { DoctorsService } from 'src/app/services/doctors/doctors.service';

import { inAnimation } from 'src/app/modules/animations/animations';
import { trigger, transition, useAnimation } from "@angular/animations";

@Component({
  selector: 'edit-doctor',
  templateUrl: './edit.doctor.component.html',
  styleUrls: ['./edit.doctor.component.scss'],
  animations: [
    trigger('insert', [
      transition(':enter', [
        useAnimation(inAnimation)
      ])
    ]),
  ]
})
export class EditDoctorComponent implements OnInit {
  @Input() doctor?: Doctor;
  @Output() deselect = new EventEmitter<void>();
  showSpinner: boolean = false;
  errorMessage?: string;

  constructor(private fb: FormBuilder,
    private DoctorsService: DoctorsService,
    private toastr: ToastrService,
    private actions: DoctorsActionsService) { }

  ngOnInit(): void {
    this.initialize();
  }

  doctorForm = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(15)]],
    experience: ['', [Validators.required, Validators.min(0), Validators.max(100)]],
  });

  initialize() {
    if (this.doctor) {
      this.doctorForm.setValue({
        name: this.doctor.name,
        experience: this.doctor.experience.toString()
      })
    }
  }

  edit(){
    if (!this.showSpinner && this.doctorForm.valid){
      this.showSpinner = true;
      const initialDoctor = {
        id: this.doctor!.id,
        name: this.doctor!.name,
        experience: this.doctor!.experience
      }
      const modifiedDoctor: Doctor = {
        id: this.doctor?.id!,
        name: this.doctorForm.value.name!,
        experience: Number(this.doctorForm.value.experience!)
      }
      if (JSON.stringify(modifiedDoctor) !== JSON.stringify(initialDoctor)){
        this.DoctorsService.patch(modifiedDoctor).pipe().subscribe({
          next: (doctor) => {
            this.showSpinner = false;
            this.actions.emitDoctorResponse(doctor);
            this.toastr.success(`Success`,`${doctor.name} updated`);
            this.closeEdit();
          },
          error: (err) => {
            this.showSpinner = false;
            console.log(`${err}`);
            this.toastr.error(`Failed`,`${modifiedDoctor.name} is still the same`);
            this.errorMessage = "Could not modify doctor";
          },
        });
      }
    }

  }

  remove(){
    if (!this.showSpinner){
      this.showSpinner = true;
      this.DoctorsService.delete(this.doctor!.id).pipe().subscribe({
        next: () => {
          this.showSpinner = false;
          this.toastr.success(`Success`, `${this.doctor!.name} removed`);
          this.actions.emitDoctorDelete(this.doctor!.id);
        },
        error: (err) => {
          this.toastr.warning(`Failed`, `${this.doctor!.name} still persist`);
          console.log(`${err.message}`);
        },
      });
    }
  }

  closeEdit(){
    if (!this.showSpinner){
      this.deselect.emit();
    }
  }
}
