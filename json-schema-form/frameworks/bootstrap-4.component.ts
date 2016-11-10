import {
  ChangeDetectorRef, Component, Input, OnChanges, OnInit
} from '@angular/core';

@Component({
  moduleId: module.id,
  selector: 'bootstrap-4-framework',
  template: `
    <select-widget-widget
      [layoutNode]="layoutNode"
      [formSettings]="formSettings"
      [dataIndex]="dataIndex"
      [layoutIndex]="layoutIndex"></select-widget-widget>`,
})
export class Bootstrap4Component implements OnInit, OnChanges {
  @Input() layoutNode: any;
  @Input() formSettings: any;
  @Input() layoutIndex: number[];
  @Input() dataIndex: number[];

  constructor(
    private changeDetector: ChangeDetectorRef
  ) { }

  ngOnInit() {}

  ngOnChanges() {}
}
