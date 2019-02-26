import OSS from 'ali-oss'
import { Packager } from 'app-builder-lib';
import { Arch } from 'builder-util';
import { HttpPublisher, PublishContext, UploadTask } from 'electron-publish';
// import { createReadStream } from 'fs-extra-p';
import { basename, resolve } from 'path';


interface AliOssPublishContext extends PublishContext {
    readonly packager: Packager;
}
interface AliOssUploadTask extends UploadTask {
    readonly packager: Packager;
}
interface AliOssPublisherConfig {
    bucket: string;
    region: string;
    accessKeyId: string;
    accessKeySecret: string;
    resumable: boolean;
    verbose: boolean;
    maxResume: number;
    localConfig: string;
    path: string;
}
export default class AliOssPublisher extends HttpPublisher {
    public readonly providerName = 'alioss';
    protected useSafeName: boolean = true;
    private readonly client: OSS
    protected readonly context!: AliOssPublishContext;
    protected config: AliOssPublisherConfig;

    protected constructor(context: AliOssPublishContext, publishConfig: AliOssPublisherConfig, useSafeArtifactName?: boolean) {
        super(context);
        // const config = this.getConfig();
        this.useSafeName = useSafeArtifactName || true;
        let config = publishConfig;
        if (publishConfig.localConfig) {
            const localConfig = require(resolve(this.context.packager.appDir, config.localConfig));
            config = {
                ...config,
                ...localConfig
            }
        }
        this.config = {
            resumable: true,
            ...config
        };
        this.client = new OSS({
            region: config.region,
            //云账号AccessKey有所有API访问权限，建议遵循阿里云安全最佳实践，部署在服务端使用RAM子账号或STS，部署在客户端使用STS。
            accessKeyId: config.accessKeyId,
            accessKeySecret: config.accessKeySecret,
            bucket: config.bucket
        });
    }
    public async upload(task: AliOssUploadTask): Promise<any> {
        const fileName =
            (this.useSafeName ? task.safeArtifactName : null) || basename(task.file);
        const os = task.packager['platform'].buildConfigurationKey || task.packager['platform'].name; 
        let archName = Arch[Arch.x64];
        if(!task.arch && task.arch !== 0){
            if(task.packager['platform'].nodeName.indexOf('32') >= 0){
                archName = Arch[Arch.ia32]
            }
        }else{
            archName = Arch[task.arch]
        }
        await this.doUpload(fileName, task.file, archName, os);
    }
    public async doUpload(fileName, filePath, archName, os) {
        const config = this.config;
        const appInfo = this.context.packager.appInfo;
        let uploadName: string = fileName;
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
            let checkpoint;
            try {
                for (let i = 0; i < (resumable ? maxResume : 1); i++) {
                    // try to resume the upload
                    console.log(`${uploadName}: uploading...🕑 `)
                    const result = await this.client.multipartUpload(uploadName, filePath, {
                        progress: async (percentage, cpt) => {
                            checkpoint = cpt;
                            if (this.config.verbose && cpt) {
                                console.log(`${uploadName}: ${cpt.doneParts.length}\/${Math.ceil(cpt.fileSize / cpt.partSize)}(${(percentage * 100).toFixed(2)}%)`)
                            }
                        },
                        checkpoint: checkpoint,
                        meta: {
                        }
                    });
                    resolve(result);
                    console.log(`${uploadName}: upload success...✅ `)
                    break; // break if the upload success;
                }
            } catch (e) {
                // 捕获超时异常
                if (e.code === 'ConnectionTimeoutError') {
                    console.error("Woops,Timeout!");
                    // do ConnectionTimeoutError operation
                }
                console.error(e)
            }
        });
    }
    public toString() {
        return `${this.providerName}(${this.config.bucket})`;
    }
}