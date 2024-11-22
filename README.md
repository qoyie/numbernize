# 任意数字化工具

任意の数値を任意の数字からなる数式に分解するツール。[itorr/homo](https://github.com/itorr/homo)に触発されて作った。

## プロジェクトのホームページ

[https://qoyie.com/numbernize/](https://qoyie.com/numbernize/)

## 使い方

ビルド

```bash
npm run build
```

```html
<script type="module">
import numbernize from "index.js"
numbernize.init(114514);
let 悪臭 = numbernize(1919810);
// "114514*(11-4-5+14)+114*514+114*51*4+1145*(1+4)+11-4+5+1-4"
</script>
```

```bash
$ npm start 114514
Initialized successfully.
> 1919810
114514*(11-4-5+14)+114*514+114*51*4+1145*(1+4)+11-4+5+1-4
> ^C
```

### CDN

```HTML
<script type="" src="https://cdn.jsdelivr.net/gh/qoyie/numbernize@master/index.js"></script>
```

## ライセンス

MIT
