import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { WidgetLibraryModule } from '../widget-library/widget-library.module';
import { WidgetLibraryService } from '../widget-library/widget-library.service';

import { FrameworkLibraryService } from './framework-library.service';
import { NoFrameworkComponent } from './no-framework.component';

@NgModule({
  imports:         [
    CommonModule, WidgetLibraryModule,
  ],
  declarations:    [ NoFrameworkComponent ],
  exports:         [
    NoFrameworkComponent,
  ],
  entryComponents: [ NoFrameworkComponent ],
  providers:       [ WidgetLibraryService, FrameworkLibraryService ]
})
export class FrameworkLibraryModule { }
