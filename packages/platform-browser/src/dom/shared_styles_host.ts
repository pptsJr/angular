/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {Inject, Injectable, OnDestroy} from '@angular/core';
import {getDOM} from './dom_adapter';
import {DOCUMENT} from './dom_tokens';

@Injectable()
export class SharedStylesHost {
  /** @internal */
  protected _styles = new Map<string, number>();

  addStyles(styles: string[]): void {
    const additions = new Set<string>();
    styles.forEach(style => {
      if (this._styles.has(style)) {
        const refCount = this._styles.get(style) + 1;
        this._styles.set(style, refCount);
      } else {
        this._styles.set(style, 1);
        additions.add(style);
      }
    });
    this.onStylesAdded(additions);
  }

  removeStyles(styles: string[]): void {
    styles.forEach(style => {
      const refCount = this._styles.get(style) - 1;
      if (refCount === 0) {
        this._styles.delete(style);
        getDOM().remove(this._styleNodes.get(style));
        this._styleNodes.delete(style);
      } else {
        this._styles.set(style, refCount);
      }
    });
  }

  onStylesAdded(additions: Set<string>): void {}

  getAllStyles(): string[] { return Array.from(this._styles.keys()); }
}

@Injectable()
export class DomSharedStylesHost extends SharedStylesHost implements OnDestroy {
  private _hostNodes = new Set<Node>();
  private _styleNodes = new Set<Node>();
  constructor(@Inject(DOCUMENT) private _doc: any) {
    super();
    this._hostNodes.add(_doc.head);
  }

  private _addStylesToHost(styles: Set<string>, host: Node): void {
    styles.forEach((style: string) => {
      const styleEl = this._doc.createElement('style');
      styleEl.textContent = style;
      this._styleNodes.add(host.appendChild(styleEl));
    });
  }

  addHost(hostNode: Node): void {
    this._addStylesToHost(this._stylesSet, hostNode);
    this._hostNodes.add(hostNode);
  }

  removeHost(hostNode: Node): void { this._hostNodes.delete(hostNode); }

  onStylesAdded(additions: Set<string>): void {
    this._hostNodes.forEach(hostNode => this._addStylesToHost(additions, hostNode));
  }

  ngOnDestroy(): void { this._styleNodes.forEach(styleNode => getDOM().remove(styleNode)); }
}
