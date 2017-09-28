import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { WidgetLibraryModule } from '../../widget-library/widget-library.module';

import { WidgetLibraryService } from '../../widget-library/widget-library.service';
import { FrameworkLibraryService } from '../framework-library.service';

import { Bootstrap3FrameworkComponent } from './bootstrap-3-framework.component';

@NgModule({
  imports:         [ CommonModule, WidgetLibraryModule ],
  declarations:    [ Bootstrap3FrameworkComponent ],
  exports:         [ Bootstrap3FrameworkComponent ],
  entryComponents: [ Bootstrap3FrameworkComponent ],
  providers:       [ WidgetLibraryService, FrameworkLibraryService ]
})
export class Bootstrap3FrameworkModule { }
