#!/usr/bin/env node

//LIBS
const yargs = require('yargs'); // handle command line arguments
const fs = require('fs'); // read file system
const https = require('https'); // http request
const _ = require('lodash'); // utility library
const figlet = require('figlet'); // printing logo - nice fonts: Double Shorts, Def Leppard, Cygnet, Cybermedium, Cricket, Chunky, Big
const chalk = require('chalk'); // printing in colors

//VARS
const deeplUrl = 'https://api.deepl.com/v2/translate?';
const deeplUrlDev = 'https://api-free.deepl.com/v2/translate?';
const settingsFileName = '.transc';

const defaultSettings = {
    path: './i18n',
    sourceLangFile: 'en.json',
    transLangCodes: ['ES', 'FR', 'DE'],
    authKey: '',
    useDevAPI: false
}

//CLI definition
const argv = yargs
    .command('init', 'Initialize the translation cli by adding a .transc settings file to your project. ' +
        'Please edit it afterwards! Check https://www.deepl.com/docs-api/translating-text/ for lang codes.')
    .usage(logo())
    .usage('Just execute "transc" inside your npm project to generate new/overwrite existing json translation files, ' +
        'based on your sourceLangFile defined in the .transc settings file.')
    .help()
    .alias('help', 'h')
    .argv;

//IMPLEMENTATION

// base command
if (!argv._.length) {
    main().then();
}

// init command
if (argv._.includes('init')) {
    init();
}

//HELPER

async function main() {
    console.log(`${chalk.blue('Transc')} | Starting translations ..`);
    let settings = readFile('./', settingsFileName);
    if (!settings) {
        console.log(`Settings does not exist or contains errors. Please execute ${chalk.bgBlack.white('transc init')} first.`);
        return
    }
    if (!settings.authKey || !settings.path || !settings.sourceLangFile || !settings.transLangCodes) {
        console.log(`Settings file incomplete. Please execute ${chalk.bgBlack.white('transc init')} and edit the generated settings file.`);
        return
    }
    let sourceContent = readFile(settings.path, settings.sourceLangFile);
    const [flattenKeys, flattenValues] = flatten(sourceContent);

    for(const targetLang of settings.transLangCodes) {
        try {
            const translations = await translate(settings.authKey, settings.useDevAPI, flattenValues, targetLang);
            const transData = wrapContent(flattenKeys, translations);
            const result = writeFile(settings.path, `${targetLang.toLowerCase()}.json`, transData);
            if (result) {
                console.log(`${targetLang}: ${chalk.green('Done')}`);
            } else {
                console.log(`${targetLang}: ${chalk.red('Failed')}`);
            }
        } catch (e) {
            console.log(`${targetLang}: ${chalk.red('Something went wrong!')}`);
        }
    }
}

/*
 * Init command
 * check if settings exists? Create settings file
 */
function init() {
    let settings = readFile('./', settingsFileName);
    if (settings) {
        console.log(chalk.yellow(`A ${settingsFileName} settings file already exists! Please edit it.`));
        return
    }

    let written = writeFile('./', settingsFileName, defaultSettings);
    if (written) {
        console.log(`A ${settingsFileName} settings file was created! Please edit it.`);
    }
}

function readFile(path, name) {
    path = path[path.lenght-1] === '/' ? path : path + '/';
    try {
        let content = fs.readFileSync(path + name, 'utf-8');
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

function flatten(sourceContent) {
    let flattenKeys = [];
    let flattenValues = [];

    function _fl(obj, parents = []){
        Object.entries(obj).forEach(([key, value]) => {
            if (typeof value === 'object') {
                _fl(value, [...parents,key]);
            } else {
                flattenKeys.push([...parents,key].join('.'));
                flattenValues.push(value);
            }
        });
    }
    _fl(sourceContent);
    return [flattenKeys, flattenValues];
}

/**
 * Insert translations into old data structure
 */
function wrapContent(flattenKeys, translations) {
    let translated = {};
    if(flattenKeys.length !== translations.length) {
        return false;
    }

    flattenKeys.forEach((key, i) => {
        _.set(translated, key,translations[i] ?? '-');
    });
    return translated;
}

/**
 * Return transc as cli logo
 */
function logo() {
    return chalk.blue(figlet.textSync('transc', {
        font: "Cybermedium",
        horizontalLayout: 'default',
        verticalLayout: 'default',
        width: 80,
        whitespaceBreak: true
    }))
}

/**
 * Translate content array into desired language
 * returns translations
 */
async function translate(key, devMode, content, targetLangCode, sourceLangCode= null) {
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
                const dataObject = JSON.parse(data);
                if(dataObject.message) {console.log(dataObject.message)}
                resolve(dataObject.translations.map(obj => obj.text));
            });
        });
    });
}