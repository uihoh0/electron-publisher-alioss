# electron-publisher-alioss
 
electron-builder AliYun OSS bucket publisher 

Base beyond @FNCxPro's [electron-publisher-gcs](https://github.com/FNCxPro/electron-publisher-gcs)

## How to Use
Install `electron-publisher-alioss`
```
    npm i -D electron-publisher-alioss
```
OR
```
    yarn add -D electron-pulisher-alioss
```

Next, set your publish providers as below
```jsonc
//package.json
{
  "name": "your-app-name",
  "build": {
    "appId": "your.appId",
    "compression": "normal",
    "productName": "your App",
    "win": {
      "target": "nsis"
    },
    "publish": [
        {
          "provider": "generic",
          "url": "https:///${name}/${os}/${arch}/"
        },
        {
            "provider": "custom",
            "providerName": "alioss", 
            "path": "/${name}/${os}/${arch}/${filename}",
            "bucket": "test",
            "region": "oss-region",
            "accessKeyId": "your-ali-oss-accesskeyid",
            "accessKeySecret": "your-ali-oss-accesskeysecrect",
            "resumable": true
        }
      ]
  }
}
```
**if you want to save your ali-oss bucket info in anther file, you can use localConfig**
```jsonc
//package.json
{
  "name": "your-app-name",
  "build": {
    "appId": "your.appId",
    "compression": "normal",
    "productName": "your App",
    "win": {
      "target": "nsis"
    },
    "publish": [
        {
          "provider": "generic",
          "url": "https:///${name}/${os}/${arch}/"
        },
        {
            "provider": "custom",
            "providerName": "alioss", 
            "localConfig": "~/some/where/u/want/ali-oss-config.json"
        }
      ]
  }
}
```

```jsonc
// ~/some/where/u/want/ali-oss-config.json
{
    "path": "/${name}/${os}/${arch}/${filename}",
    "bucket": "test",
    "region": "oss-region",
    "accessKeyId": "your-ali-oss-accesskeyid",
    "accessKeySecret": "your-ali-oss-accesskeysecrect",
    "resumable": true
}
```


### `path`
Type: `string`  
Default: `/${name}/${os}/${arch}/${filename}`

* `name`: the app's name (from electron-builder)  
* `os`: `task.packager.platform.name`  
* `arch`: Architecture  
* `filename`: The filename of the file being uploaded

Example:
```
/${name}/${os}/${arch}/${filename}
```


### `resumable`
Type: `boolean`  
Default: `true`
