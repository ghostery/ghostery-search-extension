"use strict"

const loginButton = document.querySelector('#login-button');
const signInTemplate = document.querySelector('#signin-button-template');

browser.runtime.sendMessage({
  action: 'getTokenCount'
}).then((result) => {
  if (loginButton && signInTemplate && result === 0) {
    while (loginButton.firstChild) {
      loginButton.firstChild.remove();
    }
    const signIn = signInTemplate.content.cloneNode(true);
    loginButton.appendChild(signIn);
  }
});
