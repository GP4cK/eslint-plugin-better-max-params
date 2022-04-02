# eslint-plugin-better-max-params

Set a max param number for your constructors, functions, methods etc.

## Installation

You'll first need to install [ESLint](https://eslint.org/):

```sh
npm i eslint --save-dev
```

Next, install `eslint-plugin-better-max-params`:

```sh
npm install eslint-plugin-better-max-params --save-dev
```

## Usage

Add `better-max-params` to the plugins section of your `.eslintrc` configuration file. You can omit the `eslint-plugin-` prefix:

```json
{
    "plugins": [
        "better-max-params"
    ]
}
```

Then configure the rules you want to use under the rules section.

```json
{
    "rules": {
        "better-max-params/better-max-params": {
            "func": 5,
            "constructor": 10
        }
    }
}
```

`func` and `constructor` are optional. If you don't provide them, no limit will be set.

## Supported Rules

* better-max-params
