# sketch-polyfill-console

A [console](https://developer.mozilla.org/en-US/docs/Web/API/Console) polyfill for sketch. It is automatically included (when needed) when using [skpm](https://github.com/skpm/skpm).

It is allow to log in both the JavaScript context and the Sketch channel, ie. it calls both `console.x` and `log`.

It also provide a useful logging method `console.dump` to introspect a [Mocha](https://github.com/logancollins/Mocha) object

## Installation

```bash
npm i -S sketch-polyfill-console
```

## Usage

```js
import console from 'sketch-polyfill-console'

console.log('hello world')

console.dump(context.document)
```
