# #transc (CLI)
Translation CLI using **deepL** to simply convert your source i18n json language file into different target languages.

Just execute `transc` to generate your translations:
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
Based on your source file (e.g.: en.json) :
```JSON
{
  "translationKey": "Word or sentences",
  "topic": {
    "nestedKey": "To structure your keys.",
    "placeholder": "You have entered {{name}} {{surname}}"
  }
}
```

Use ``transc -h`` for help.

## Supported languages
Bulgarian (BG), Czech (CS), Danish (DA), German (DE), Greek (EL), English (EN), Spanish (ES), Estonian (ET), Finnish (FI), French (FR), Hungarian (HU), Italian (IT), Japanese (JA), Lithuanian (LT), Latvian (LV), Dutch (NL), Polish (PL), Portuguese (PT), Romanian (RO), Russian (RU), Slovak (SK), Slovenian (SL), Swedish (SV), Chinese (ZH) 

According to https://www.deepl.com/docs-api/translating-text/request/

## Setup
Install transc package as devDependency inside your project using:

``npm i -D transc``

Now you should be able to run the setup, generating a .transc config file:

``transc init``

Edit the .transc file according to your needs.

```
{
	"path": "./i18n",            // folder, where translation files are located
	"sourceLangFile": "en.json", // language file that is used as source of translations 
	"transLangCodes": [
		"es", "fr"           // target translation languages as language code
	],
	"authKey": "xyz...",    // deepl api key: https://www.deepl.com/pro#developer
	"useDevAPI": false      // true for DeepL API Free
}
```

Now you ready to go: ``transc``

## TODOs
- handling large files by split the requests

## Thanks
Thank you deepL for offering such an awesome service!
