import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { FlexLayoutModule } from '@angular/flex-layout';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import {
  MatButtonModule, MatButtonToggleModule, MatCardModule, MatCheckboxModule,
  MatDatepickerModule, MatFormFieldModule, MatGridListModule, MatIconModule,
  MatInputModule, MatNativeDateModule, MatRadioModule, MatSelectModule,
  MatSliderModule, MatSlideToggleModule, MatTabsModule, MatTooltipModule,
} from '@angular/material';
/**
 * unused @angular/material modules:
 * MatAutocompleteModule, MatChipsModule, MatDialogModule, MatExpansionModule,
 * MatListModule, MatMenuModule, MatPaginatorModule, MatProgressBarModule,
 * MatProgressSpinnerModule, MatSidenavModule, MatSnackBarModule,
 * MatSortModule, MatTableModule, MatToolbarModule, MatStepperModule,
 */

import { WidgetLibraryModule } from '../../widget-library/widget-library.module';
import { JsonSchemaFormService } from '../../json-schema-form.service';

import { MATERIAL_DESIGN_COMPONENTS } from './index';

@NgModule({
  imports: [
    CommonModule, FlexLayoutModule, FormsModule, ReactiveFormsModule,
    MatButtonModule, MatButtonToggleModule, MatCardModule, MatCheckboxModule,
    MatDatepickerModule, MatFormFieldModule, MatGridListModule, MatIconModule,
    MatInputModule, MatNativeDateModule, MatRadioModule, MatSelectModule,
    MatSliderModule, MatSlideToggleModule, MatTabsModule, MatTooltipModule,
    WidgetLibraryModule
  ],
  declarations:    [ ...MATERIAL_DESIGN_COMPONENTS ],
  exports:         [ ...MATERIAL_DESIGN_COMPONENTS ],
  entryComponents: [ ...MATERIAL_DESIGN_COMPONENTS ],
  providers:       [ JsonSchemaFormService ]
})
export class MaterialDesignFrameworkModule { }
