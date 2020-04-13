export const enum PromiseState {
  IsPending = `isPending`,
  HasValue = `hasValue`,
  HasError = `hasError`,
}

export class InspectablePromise<T> {
  static from<T>(promise: Promise<T>, onResolved?: () => void): InspectablePromise<T> {
    return new InspectablePromise(promise, onResolved);
  }

  public value: T;
  public error: Error;
  public promise: Promise<T>;
  public state: PromiseState;

  /** unix milliseconds when the inspectable promise was initialized */
  public initTime: number;
  /** duration in milliseconds to load/resolve the promise */
  public timeToLoadMs: number;

  constructor(promise: Promise<T>, onResolved?: () => void) {
    this.state = PromiseState.IsPending;
    this.promise = promise;
    this.initTime = Date.now();

    this.promise
      .then(
        (value) => {
          this.state = PromiseState.HasValue;
          this.value = value;
        },
        (error) => {
          this.state = PromiseState.HasError;
          this.error = error;
        },
      )
      .finally(() => {
        this.timeToLoadMs = Date.now() - this.initTime;
        if (typeof onResolved === `function`) {
          onResolved();
        }
      });
  }

  isPending(): boolean {
    return this.state === PromiseState.IsPending;
  }

  hasValue(): boolean {
    return this.state === PromiseState.HasValue;
  }

  hasError(): boolean {
    return this.state === PromiseState.HasError;
  }
}
