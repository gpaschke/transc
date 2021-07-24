# #transc (CLI)
Translation CLI using **deepL** to simply convert your source i18n json language file into different target languages.

Just execute `transc` and generate your translations. e.g.:
```
package.json
..
src/
  i18n/
    en.json
    -> es.json
    -> fr.json
    -> de.json
    -> ru.json
```
Based on your source file (en.json - but not limited to english) :
```JSON
{
  "translationKey": "Word or sentences",
  "topic": {
    "nestedKey": "To structure your keys.",
    "placeholder": "You have entered {{name}} {{surname}}"
  }
}
```


## Setup
Install transc package as devDependency inside your project using:

``npm i -D transc``

Now you should be able to run the setup, generating a .transc config file:

``transc init``

Edit the .transc file according to your needs.

```
{
	"path": "./i18n", // folder, where your translation files are located
	"sourceLangFile": "en.json", // language file that should be used as source for further translations
	"transLangCodes": [
		"es", "fr" // add your target translation languages here as language code. Use https://www.deepl.com/docs-api/translating-text/request/ as reference for language codes.
	],
	"authKey": "xyz...", // you need a deepl api key: https://www.deepl.com/pro#developer
	"useDevAPI": false // true when you want to use DeepL API Free
}
```

Now you ready to go: ``transc``

## TODOs
- handling large files by split the requests

## Thanks
Thank you deepl team for offering such an awesome service!
