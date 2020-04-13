export type StateUpdateListener<T> = (update: Partial<T>, state: T) => void;

/**
 * StateStore stores state and allows an observer to listen to state updates
 */
export class StateStore<T> {
  private _listeners: Array<StateUpdateListener<T>> = [];
  private _state: T = {} as T;

  get state(): T {
    return this._state;
  }

  update(props: Partial<T>) {
    // always create a new state object.
    // if lastState === newState then state hasn't changed
    this._state = Object.assign({}, this._state, props);
    this._listeners.forEach((listener) => listener(props, this._state));
  }

  /** returns a function that when called, removes the listener */
  addUpdateListener(listener: StateUpdateListener<T>): () => void {
    this._listeners.push(listener);
    return () => this.removeUpdateListener(listener);
  }

  removeUpdateListener(listener: StateUpdateListener<T>) {
    this._listeners = this._listeners.filter((l) => l !== listener);
  }
}

export default StateStore;
