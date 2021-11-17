## notes
- only server can create and destroy cookie
```js
res.cookie("token", token, { httpOnly: true });
```
