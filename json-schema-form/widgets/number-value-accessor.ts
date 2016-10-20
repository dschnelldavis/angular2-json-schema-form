import { Directive, ElementRef, Renderer, forwardRef } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

import { isBlank } from '../validators/validator-functions';

export const NUMBER_VALUE_ACCESSOR: any = {
  provide: NG_VALUE_ACCESSOR,
  useExisting: forwardRef(() => NumberValueAccessor),
  multi: true
};

/**
 * The accessor for writing a number value and listening to changes that is used by the
 * {@link NgModel}, {@link FormControlDirective}, and {@link FormControlName} directives.
 *
 *  ### Example
 *  ```
 *  <input type="number" [(ngModel)]="age">
 *  ```
 */
@Directive({
  selector:
    'input[type=number][formControlName][schematype=number],input[type=number][formControl][schematype=number],input[type=number][ngModel][schematype=number]',
  host: {
    '(change)': 'onChange($event.target.value)',
    '(input)': 'onChange($event.target.value)',
    '(blur)': 'onTouched()'
  },
  providers: [NUMBER_VALUE_ACCESSOR]
})
export class NumberValueAccessor implements ControlValueAccessor {
  onChange = (_: any) => {};
  onTouched = () => {};

  constructor(private _renderer: Renderer, private _elementRef: ElementRef) {}

  writeValue(value: number): void {
    const normalizedValue = isBlank(value) ? '' : value;
    this._renderer.setElementProperty(this._elementRef.nativeElement, 'value', normalizedValue);
  }

  registerOnChange(fn: (_: number) => void): void {
    this.onChange = (value) => { fn(value === '' ? null : parseFloat(value)); };
  }
  registerOnTouched(fn: () => void): void { this.onTouched = fn; }

  setDisabledState(isDisabled: boolean): void {
    this._renderer.setElementProperty(this._elementRef.nativeElement, 'disabled', isDisabled);
  }
}
