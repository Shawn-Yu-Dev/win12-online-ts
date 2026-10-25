import { $ } from '../core/dom';

export class Calculator {
  elt: string;
  num1: BigNumber | null = null;
  num2: BigNumber | null = null;
  keysContainer: string;
  operator = 0;
  preview = false;

  constructor(input: string, container: string) {
    this.elt = input;
    this.keysContainer = container;
  }

  private value(): string {
    return ($(this.elt)[0] as HTMLInputElement).value;
  }

  private setValue(value: string | number | BigNumber): void {
    ($(this.elt)[0] as HTMLInputElement).value = String(value);
  }

  get_num(): BigNumber {
    return Big(this.value());
  }

  number_key(key: number | string): void {
    if (this.value() == '0' || this.preview) {
      this.setValue('');
      this.preview = false;
    }
    this.setValue(this.value() + key);
    this.uncheck();
  }

  func_key(key: number): void {
    if (!this.isCheck()) {
      if (this.num1 != null) {
        this.num2 = Big(this.value());
        this.num1 = Big(this._calc(this.num1, this.num2, this.operator));
        this.setValue(this.num1);
        this.preview = true;
      } else {
        this.num1 = Big(this.value());
        this.setValue(this.num1);
        this.preview = true;
      }
    }
    this.operator = key;
  }

  check(element: Element): void {
    this.uncheck();
    element.classList.add('checked');
  }

  uncheck(): void {
    for (const element of ($(this.keysContainer)[0] as HTMLElement).children) {
      element.classList.remove('checked');
    }
  }

  isCheck(): boolean {
    for (const element of ($(this.keysContainer)[0] as HTMLElement).children) {
      if (element.classList.contains('checked')) return true;
    }
    return false;
  }

  point(): void {
    if (this.value() == '') this.setValue('0');
    if (!this.value().includes('.')) this.setValue(this.value() + '.');
  }

  square(): void {
    this.setValue(Math.pow(Number(this.get_num().toString()), 2));
  }

  squareRoot(): void {
    this.setValue(Math.sqrt(Number(this.get_num().toString())));
  }

  backspace(): void {
    if (this.value().length > 0) {
      this.setValue(this.value().substring(0, this.value().length - 1));
    }
    if (this.value() == '') this.setValue('0');
  }

  clear_num(): void {
    this.setValue('0');
    this.num1 = null;
    this.num2 = null;
    this.operator = 0;
    this.uncheck();
  }

  eq(): boolean {
    this.uncheck();
    if (this.operator == 0) return true;
    this.num2 = Big(this.value());
    const num = this._calc(this.num1, this.num2, this.operator);
    this.clear_num();
    if (num != null) {
      this.setValue(num);
      return true;
    }
    return false;
  }

  private _calc(n1: BigNumber, n2: BigNumber, c: number): string | null {
    switch (c) {
      case 1:
        return n1.plus(n2).toString();
      case 2:
        return n1.minus(n2).toString();
      case 3:
        return n1.times(n2).toString();
      case 4:
        return Number(n2.toString()) != 0 ? n1.div(n2).toString() : null;
      default:
        return null;
    }
  }
}

export const widgetCalculator = new Calculator(
  '#calc-input-widgets',
  '#widgets .calc>.content',
);
export const appCalculator = new Calculator('#calc-input', '#win-calc>.keyb');

window.appCalculator = appCalculator;
window.widgetCalculator = widgetCalculator;
