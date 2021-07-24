#!/usr/bin/env node

//LIBS
const yargs = require('yargs'); // handle command line arguments
const fs = require('fs'); // read file system
const https = require('https'); // http request
const _ = require('lodash'); // utility library

//VARS
const deeplUrl = 'https://api.deepl.com/v2/translate?';
const deeplUrlDev = 'https://api-free.deepl.com/v2/translate?';
const settingsFileName = '.transc';

//CLI definition
const argv = yargs
    .command('init', 'Initialize the translation cli by adding a .transc settings file to your project. Please edit it afterwards! Check https://www.deepl.com/docs-api/translating-text/ for lang codes.')
    .usage('Just execute "transc" inside your npm project to generate new/overwrite existing json translation files, based on your sourceLangFile defined in the .transc settings file.')
    .help()
    .alias('help', 'h')
    .argv;

//IMPLEMENTATION

/*
 * Base command
 */
if (!argv._.length) {
    main().then();
}

/*
 * Init command
 * - check if settings exists? use existing as defaults
 * - ask for: path, source language file, target languages, key, developer api
 */
if (argv._.includes('init')) {
    let settings = readFile('./', settingsFileName);
    if (settings) {
        console.log(`A ${settingsFileName} settings file already exists! Please edit it.`);
        return
    }

    settings = {
        path: './i18n',
        sourceLangFile: 'en.json',
        transLangCodes: ['DE', 'FR'],
        authKey: '',
        useDevAPI: false
    }
    let written = writeFile('./', settingsFileName, settings);
    if (written) {
        console.log(`A ${settingsFileName} settings file was created! Please edit it.`);
    }

}

//HELPER

async function main() {
    let settings = readFile('./', settingsFileName);
    if (!settings) {
        console.log(`Settings does not exist. Please execute 'transc init' first.`);
        return
    }
    if (!settings.authKey || !settings.path || !settings.sourceLangFile || !settings.transLangCodes) {
        console.log(`Settings file incomplete. Please execute 'transc init' and edit the generated settings file.`);
        return
    }
    let sourceContent = readFile(settings.path, settings.sourceLangFile);
    let preparedContent = prepareContent(sourceContent);

    for(const targetLang of settings.transLangCodes) {
        try {
            let resData = await translate(settings.authKey, settings.useDevAPI, preparedContent, targetLang);
            let translations = resData.translations.map(obj => obj.text);
            let transData = wrapContent(sourceContent, translations);
            const result = writeFile(settings.path, targetLang.toLowerCase() + '.json', transData);
            console.log(targetLang + (result ? ': Done' : ': Failed'));
        } catch (e) {
            console.log(targetLang + ': Something went wrong! Maybe your target language (code) is not supported?');
        }
    }
}

function readFile(path, name) {
    path = path[path.lenght-1] === '/' ? path : path + '/';
    try {
        let content = fs.readFileSync(path+name, 'utf-8');
        return JSON.parse(content)
    } catch (e) {
        return null;
    }
}

function writeFile(path, name, content){
    path = path[path.lenght-1] === '/' ? path : path + '/';
    const prettyContent = JSON.stringify(content, null, '\t');
    try {
        fs.writeFileSync(path+name, prettyContent, 'utf-8');
        return true;
    } catch (e) {
        console.log('Could not write file: ' + name);
        return false;
    }
}

function prepareContent(iObject){
    function _flat(object) {
        return [].concat(...Object.values(object)
            .map(value => typeof value === 'object' ? _flat(value) : value));
    }
    return _flat(iObject);
}

/**
 * Insert translations into old data structure
 * @param source
 * @param translations
 */
function wrapContent(source, translations) {
    let flattenKeys = [];
    function _fl(obj, parents = []){
        Object.entries(obj).forEach(([key, value]) => {
            if (typeof value === 'object') {
                _fl(value, [...parents,key]);
            } else {
                flattenKeys.push([...parents,key].join('.'));
            }
        });
    }
    _fl(source);

    if(flattenKeys.length !== translations.length) {
        return false;
    }

    let translated = _.cloneDeep(source)
    flattenKeys.forEach((key, i) => {
        _.set(translated, key,translations[i] ?? 'no translation');
    });
    return translated;
}

/**
 *
 * @param key
 * @param devMode
 * @param content Array of sentences
 * @param targetLangCode DE, EN
 * @param sourceLangCode
 * returns translations Array of sentences
 */
async function translate(key, devMode, content, targetLangCode, sourceLangCode) {
    let url = devMode ? deeplUrlDev : deeplUrl;
    url += 'auth_key=' + key;
    url += '&target_lang=' + targetLangCode;
    if(sourceLangCode) url += '&source_lang=' + sourceLangCode;

    content.forEach(element => {
        url += '&text=' + element;
    });

    return await new Promise((resolve) => {
        https.get(url, res => {
            let data = '';
            res.on('data', (chunk) => {
                data += chunk;
            });
            res.on('end', () => {
                data = JSON.parse(data);
                if(data.message) {console.log(data.message)}
                resolve(data);
            });
        });
    });
}