# Third-party notices

Sketchboard's own code is licensed under the MIT License (see [LICENSE](LICENSE)).

It uses the third-party software below. **None of it is copied into this repository**: it is
downloaded by `npm install` (see `app/package.json`). The notices are provided so that anyone who
builds and redistributes the app (for example by publishing the `app/dist` folder) keeps the
required attributions.

Versions are the ones pinned in `app/package.json`.

| Package | Version | License | Copyright |
| --- | --- | --- | --- |
| [@excalidraw/excalidraw](https://github.com/excalidraw/excalidraw) | 0.18.1 | MIT | Copyright (c) 2020 Excalidraw |
| [react](https://github.com/facebook/react) | 18.3.1 | MIT | Copyright (c) Facebook, Inc. and its affiliates |
| [react-dom](https://github.com/facebook/react) | 18.3.1 | MIT | Copyright (c) Facebook, Inc. and its affiliates |
| [nanoid](https://github.com/ai/nanoid) | 5.0.7 | MIT | Copyright 2017 Andrey Sitnik |
| [idb-keyval](https://github.com/jakearchibald/idb-keyval) | 6.2.1 | Apache-2.0 | Copyright 2016, Jake Archibald |

Each of these packages also depends on further packages with their own licenses. The bundled
Excalidraw component alone includes many (for example Mermaid and KaTeX). To list every license
in a build, run `npx license-checker --production` inside `app/` after `npm install`.

## MIT License text

The MIT packages above (@excalidraw/excalidraw, react, react-dom, nanoid) are each distributed
under the following terms, with the copyright line from the table above:

```
MIT License

Copyright (c) <year> <copyright holder as listed in the table above>

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

The Excalidraw text above matches the license published at
https://github.com/excalidraw/excalidraw/blob/master/LICENSE (copyright "2020 Excalidraw").

## Apache License 2.0 (idb-keyval)

idb-keyval is licensed under the Apache License, Version 2.0. You may obtain a copy of the license
at http://www.apache.org/licenses/LICENSE-2.0. Unless required by applicable law or agreed to in
writing, the software is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
KIND. The full text is also included in the package as `node_modules/idb-keyval/LICENCE`.

## Fonts

`@excalidraw/excalidraw` ships these font families, which `app/scripts/copy-fonts.mjs` copies from
`node_modules` into `app/public/fonts` for offline use: Assistant, Cascadia, Comic Shanns,
Excalifont, Liberation, Lilita, Nunito, Virgil and Xiaolai.

- The font files are **not** committed to this repository (`app/public/fonts` is gitignored).
- The npm package does not include license files for these fonts, and the Excalidraw repository
  does not either, so their individual license terms were **not verified** while preparing this
  file. If you redistribute a build that contains `dist/fonts`, check each font's upstream license
  first.
