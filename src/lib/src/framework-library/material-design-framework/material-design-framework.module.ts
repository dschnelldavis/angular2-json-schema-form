import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { FlexLayoutModule } from '@angular/flex-layout';
import {
  MatButtonModule, MatButtonToggleModule, MatCardModule, MatCheckboxModule,
  MatDatepickerModule, MatFormFieldModule, MatGridListModule, MatIconModule,
  MatInputModule, MatNativeDateModule, MatRadioModule, MatSelectModule,
  MatSliderModule, MatSlideToggleModule, MatTabsModule, MatTooltipModule,
} from '@angular/material';
export const ANGULAR_MATERIAL_MODULES = [
  MatButtonModule, MatButtonToggleModule, MatCardModule, MatCheckboxModule,
  MatDatepickerModule, MatFormFieldModule, MatGridListModule, MatIconModule,
  MatInputModule, MatNativeDateModule, MatRadioModule, MatSelectModule,
  MatSliderModule, MatSlideToggleModule, MatTabsModule, MatTooltipModule,
];
/**
 * unused @angular/material modules:
 * MatAutocompleteModule, MatChipsModule, MatDialogModule, MatExpansionModule,
 * MatListModule, MatMenuModule, MatPaginatorModule, MatProgressBarModule,
 * MatProgressSpinnerModule, MatSidenavModule, MatSnackBarModule,
 * MatSortModule, MatTableModule, MatToolbarModule, MatStepperModule,
 */

import { WidgetLibraryModule } from '../../widget-library/widget-library.module';
import { JsonSchemaFormService } from '../../json-schema-form.service';

import { MATERIAL_FRAMEWORK_COMPONENTS } from './index';

@NgModule({
  imports: [
    CommonModule, BrowserAnimationsModule, FormsModule, ReactiveFormsModule,
    FlexLayoutModule, ...ANGULAR_MATERIAL_MODULES, WidgetLibraryModule
  ],
  declarations:    [ ...MATERIAL_FRAMEWORK_COMPONENTS ],
  exports:         [
    ...MATERIAL_FRAMEWORK_COMPONENTS, ...ANGULAR_MATERIAL_MODULES,
    BrowserAnimationsModule, FlexLayoutModule
  ],
  entryComponents: [ ...MATERIAL_FRAMEWORK_COMPONENTS ],
  providers:       [ JsonSchemaFormService ]
})
export class MaterialDesignFrameworkModule { }
