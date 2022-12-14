import { formatDate } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { Store } from '@ngrx/store';
import { ToastrService } from 'ngx-toastr';
import { Vaccination } from 'src/app/models/vaccination';
import { Vaccine } from 'src/app/models/vaccine';
import { VaccinationsActionsService } from 'src/app/services/vaccinations/vaccinations.actions.service';
import { VaccinationsService } from 'src/app/services/vaccinations/vaccinations.service';
import { VaccinesActionsService } from 'src/app/services/vaccines/vaccines.actions.service';
import { VaccinesService } from 'src/app/services/vaccines/vaccines.service';
import { selectUserId } from 'src/app/store/app.states';

import { inAnimation } from 'src/app/modules/animations/animations';
import { trigger, transition, useAnimation } from "@angular/animations";

@Component({
  selector: 'edit-vaccination',
  templateUrl: './edit.vaccination.component.html',
  styleUrls: ['./edit.vaccination.component.scss'],
  animations: [
    trigger('insert', [
      transition(':enter', [
        useAnimation(inAnimation)
      ])
    ]),
  ]
})
export class EditVaccinationComponent implements OnInit {
  @Input() vaccination?: Vaccination;
  @Output() deselect = new EventEmitter<void>();
  showSpinner: boolean = false;
  errorMessage?: string;
  userId?: string;
  vaccines?: Vaccine[];

  constructor(private fb: FormBuilder,
    private VaccinationsService: VaccinationsService,
    private actions: VaccinationsActionsService,
    private VaccinesService: VaccinesService,
    private vaccineActions: VaccinesActionsService,
    private store: Store,
    private toastr: ToastrService,
    ) { }

  ngOnInit(): void {
    this.initialize();

    this.VaccinesService.getAllVaccines().subscribe(
      (vaccines) => (this.vaccines = vaccines)
    );

    this.store.select(selectUserId).pipe()
      .subscribe((userId) => {
        this.userId = userId;
      });
  }

  vaccinationForm = this.fb.group({
    vaccinationDate: ['', [Validators.required]],
    reVaccinationDate: ['',[Validators.required]],
    vaccineId: ['', [Validators.required]],
  });

  initialize() {
    if (this.vaccination) {
      let reVaccinationDate = new Date(this.vaccination.date);
      reVaccinationDate.setDate(reVaccinationDate.getDate() + this.vaccination.daysOfProtection);

      let day = reVaccinationDate.getDate();
      let month = reVaccinationDate.getMonth() + 1;
      let year = reVaccinationDate.getFullYear();

      let reVaccinationDateTime = year + '-' + month + '-' + day

      this.vaccinationForm.setValue({
        vaccinationDate: this.vaccination.date,
        reVaccinationDate: reVaccinationDateTime,
        vaccineId: this.vaccination.vaccine?.id!,
      })
      this.vaccineActions.emitVaccineSelect(this.vaccination.vaccine?.id!)
    }
  }

  edit(){
    if (!this.showSpinner && this.vaccinationForm.valid){
      this.showSpinner = true;
      const initialVaccination = {
        id: this.vaccination!.id,
        date: this.vaccination!.date,
        daysOfProtection: this.vaccination!.daysOfProtection,
        vaccineId: this.vaccination!.vaccineId,
        userId: this.vaccination!.user!['id']!,
      }

      let vaccinationDate = new Date(this.vaccinationForm.value.vaccinationDate!);
      let day = vaccinationDate.getDate();
      let month = vaccinationDate.getMonth() + 1;
      let year = vaccinationDate.getFullYear();

      let vaccinationDateTime = year +
        '-' + month.toLocaleString('en-US', {minimumIntegerDigits: 2}) +
        '-' + day.toLocaleString('en-US', {minimumIntegerDigits: 2})

      let reVaccinationDate = new Date(this.vaccinationForm.value.reVaccinationDate!);
      let difference = reVaccinationDate.getTime() - vaccinationDate.getTime();
      let daysOfProtection = Math.ceil(difference / (1000 * 3600 * 24));

      const modifiedVaccination: Vaccination = {
        id: this.vaccination?.id!,
        date: vaccinationDateTime,
        daysOfProtection: daysOfProtection,
        userId: this.vaccination!.user!['id']!,
        vaccineId: this.vaccinationForm.value.vaccineId!,
      }
      if (JSON.stringify(modifiedVaccination) !== JSON.stringify(initialVaccination)){
        this.VaccinationsService.patch(modifiedVaccination).pipe().subscribe({
          next: (vaccination) => {
            this.showSpinner = false;
            this.actions.emitVaccinationResponse(vaccination);
            this.toastr.info(`Vaccination on ${formatDate(vaccination.date, 'longDate', 'en-US')} updated`, `Updated`);
            this.closeEdit();
          },
          error: (err) => {
            this.showSpinner = false;
            console.log(`${err}`);
            this.toastr.error(`Vaccination on ${formatDate(modifiedVaccination.date, 'longDate', 'en-US')} is still the same`, `Failed`);
            this.errorMessage = "Could not modify vaccination";
          },
        });
      }
    }
  }

  remove(){
    if (!this.showSpinner){
      this.showSpinner = true;
      this.VaccinationsService.delete(this.vaccination!.id).pipe().subscribe({
        next: () => {
          this.showSpinner = false;
          this.toastr.success(`Vaccination on ${formatDate(this.vaccination?.date!, 'longDate', 'en-US')} removed`, `Success`);
          this.actions.emitVaccinationDelete(this.vaccination!.id);
        },
        error: (err) => {
          this.toastr.warning(`Vaccination on ${formatDate(this.vaccination?.date!, 'longDate', 'en-US')} still persist`, `Failed`);
          console.log(`${err.message}`);
        },
    });
  }
}

  closeEdit(){
    if (!this.showSpinner){
      this.initialize();
      this.deselect.emit();
    }
  }

  selectVaccine(vaccineId: any) {
    this.vaccineActions.emitVaccineSelect(vaccineId.source.value)
  }
}
