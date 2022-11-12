interface State {
  attr?: Record<string, string | null>;
  class?: Record<string, boolean>;
  event?: Record<string, (e: Event | CustomEvent) => any>;
}

class Nomad<T extends Element> {
  static of<K extends keyof HTMLElementTagNameMap>(tagName: K): Nomad<HTMLElementTagNameMap[K]>;
  static of<K extends Element = Element>(tagName: K): Nomad<K>;
  static of(tagName: string) {
    return new Nomad(tagName, {});
  }

  constructor(private tagName: string, private state: State) {}

  attr(dict: Record<string, string>) {
    return new Nomad<T>(this.tagName, {
      ...this.state,
      attr: { ...this.state.attr, ...dict },
    });
  }

  class(dict: Record<string, boolean>) {
    return new Nomad<T>(this.tagName, {
      ...this.state,
      class: { ...this.state.class, ...dict },
    });
  }

  on(dict: Record<string, (e: Event | CustomEvent) => any>) {
    return new Nomad<T>(this.tagName, {
      ...this.state,
      event: { ...this.state.event, ...dict },
    });
  }

  toNode() {
    const node = document.createElement(this.tagName) as any as T;
    Object.entries(this.state.attr ?? {}).forEach(([k, v]) => (v ? node.setAttribute(k, v) : node.removeAttribute(k)));
    Object.entries(this.state.class ?? {}).forEach(([k, v]) => (node as Element)?.classList.toggle(k, v));
    Object.entries(this.state.event ?? {}).forEach(([k, v]) => node.addEventListener(k, v));

    return node;
  }
}

export const build = Nomad.of;
