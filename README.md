# Kryxivia.UplauncherAuthentification

### Run

```
node http_server.js

open http://localhost:8080
```

### Configuration

Update the configuration as you wish on the line 236 of the template/js/app.js file

If necessary, you can make changes in the event of a success or error using the following two hook functions:

```js
callBackWhenLoginSuccess: (response) => {
      console.log('Login Success', JSON.parse(response));
},
callBackWhenLoginFail: (errResponse) => {
    console.log('Login Fail', errResponse);
},
```