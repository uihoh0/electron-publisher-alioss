"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ali_oss_1 = __importDefault(require("ali-oss"));
const builder_util_1 = require("builder-util");
const electron_publish_1 = require("electron-publish");
// import { createReadStream } from 'fs-extra-p';
const path_1 = require("path");
class AliOssPublisher extends electron_publish_1.HttpPublisher {
    constructor(context, publishConfig, useSafeArtifactName) {
        super(context);
        this.providerName = 'alioss';
        this.useSafeName = true;
        // const config = this.getConfig();
        this.useSafeName = useSafeArtifactName || true;
        let config = publishConfig;
        if (publishConfig.localConfig) {
            const localConfig = require(path_1.resolve(this.context.packager.appDir, config.localConfig));
            config = Object.assign({}, config, localConfig);
        }
        this.config = config;
        this.client = new ali_oss_1.default({
            region: config.region,
            //云账号AccessKey有所有API访问权限，建议遵循阿里云安全最佳实践，部署在服务端使用RAM子账号或STS，部署在客户端使用STS。
            accessKeyId: config.accessKeyId,
            accessKeySecret: config.accessKeySecret,
            bucket: config.bucket
        });
    }
    async upload(task) {
        const fileName = (this.useSafeName ? task.safeArtifactName : null) || path_1.basename(task.file);
        const os = task.packager['platform'].name;
        await this.doUpload(fileName, task.file, task.arch || builder_util_1.Arch.x64, os);
    }
    async doUpload(fileName, filePath, arch, os) {
        const config = this.config;
        const appInfo = this.context.packager.appInfo;
        const archName = builder_util_1.Arch[arch];
        let uploadName = fileName;
        if (config.path) {
            uploadName = config.path
                .replace(/\${name}/g, appInfo.name)
                .replace(/\${os}/g, os)
                .replace(/\${arch}/g, archName)
                .replace(/\${filename}/g, fileName);
        }
        this.context.cancellationToken.createPromise(async (resolve, reject) => {
            const { resumable } = this.config;
            const maxResume = this.config.maxResume || 5;
            try {
                console.log(`${uploadName}: uploading...🕑 `);
                for (let i = 0; i < (resumable ? maxResume : 1); i++) {
                    // try to resume the upload 5 times
                    console.log(`${uploadName}: uploading...🕑 `);
                    const result = await this.client.multipartUpload(uploadName, filePath, {
                        progress: async (percentage, checkpoint) => {
                            this.checkpoint = checkpoint;
                        },
                        checkpoint: this.checkpoint,
                        meta: {}
                    });
                    resolve(result);
                    console.log(`${uploadName}: upload success...✅ `);
                    break; // break if the upload success;
                }
            }
            catch (e) {
                // 捕获超时异常
                if (e.code === 'ConnectionTimeoutError') {
                    console.error("Woops,Timeout!");
                    // do ConnectionTimeoutError operation
                }
                console.error(e);
            }
        });
    }
    toString() {
        return `${this.providerName}(${this.config.bucket})`;
    }
}
exports.default = AliOssPublisher;
//# sourceMappingURL=index.js.map