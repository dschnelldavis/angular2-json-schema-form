import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { WidgetLibraryModule } from '../widget-library/widget-library.module';
import { WidgetLibraryService } from '../widget-library/widget-library.service';

import { FrameworkLibraryService } from './framework-library.service';

import { Bootstrap3FrameworkModule } from './bootstrap-3-framework/bootstrap-3-framework.module';
import { MaterialDesignFrameworkModule } from './material-design-framework/material-design-framework.module';

import { NoFrameworkComponent } from './no-framework.component';

@NgModule({
  imports:         [
    CommonModule, WidgetLibraryModule,
    Bootstrap3FrameworkModule, MaterialDesignFrameworkModule
  ],
  declarations:    [ NoFrameworkComponent ],
  exports:         [
    NoFrameworkComponent,
    Bootstrap3FrameworkModule, MaterialDesignFrameworkModule
  ],
  entryComponents: [ NoFrameworkComponent ],
  providers:       [ WidgetLibraryService, FrameworkLibraryService ]
})
export class FrameworkLibraryModule { }
